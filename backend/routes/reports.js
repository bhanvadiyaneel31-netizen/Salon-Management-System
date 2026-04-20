const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Local-date formatter to avoid UTC shifts
const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to generate report data server-side
async function getReportData(reportType, staffId, startDate, endDate) {
  let dateRange = { start: null, end: null };
  const now = new Date();

  if (reportType === 'daily') {
    dateRange.start = formatDate(now);
    dateRange.end = formatDate(now);
  } else if (reportType === 'weekly') {
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 6); // 7 inclusive days
    dateRange.start = formatDate(lastWeek);
    dateRange.end = formatDate(now);
  } else if (reportType === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    dateRange.start = formatDate(startOfMonth);
    dateRange.end = formatDate(now);
  } else if (reportType === 'custom') {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required for custom reports');
    }
    dateRange.start = startDate;
    dateRange.end = endDate;
  }

  if (!dateRange.start || !dateRange.end) {
    throw new Error('Invalid report parameters');
  }

  let query = `
    SELECT 
      a.id, a.appointment_date, a.appointment_time, a.status, a.price, a.notes,
      cu.name as customer_name,
      su.name as staff_name,
      s.name as service_name
    FROM appointments a
    JOIN users cu ON a.customer_id = cu.id
    LEFT JOIN users su ON a.staff_id = su.id
    JOIN services s ON a.service_id = s.id
    WHERE a.appointment_date >= ? AND a.appointment_date <= ?
  `;
  const params = [dateRange.start, dateRange.end];

  if (staffId && staffId !== 'all') {
    query += " AND a.staff_id = ?";
    params.push(staffId);
  }

  query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

  const rows = await db.allAsync(query, params);

  // Aggregations
  const totalAppointments = rows.length;
  const completed = rows.filter(r => r.status === 'completed');
  const cancelled = rows.filter(r => r.status === 'cancelled');
  const totalRevenue = completed.reduce((sum, r) => sum + Number(r.price || 0), 0);
  const avgServiceValue = completed.length > 0 ? totalRevenue / completed.length : 0;

  // Most Booked Services
  const serviceCounts = {};
  rows.forEach(r => {
    if (r.service_name) {
      serviceCounts[r.service_name] = (serviceCounts[r.service_name] || 0) + 1;
    }
  });
  const mostBookedServices = Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    summary: {
      totalAppointments,
      completedAppointments: completed.length,
      cancelledAppointments: cancelled.length,
      totalRevenue,
      avgServiceValue,
      dateRange
    },
    mostBookedServices,
    appointments: rows
  };
}

// GET /api/reports/test
router.get('/test', (req, res) => {
  res.json({ message: 'Reports route is working' });
});

// POST /api/reports/generate
router.post('/generate', requireAdmin, async (req, res) => {
  const { reportType, staffId, startDate, endDate } = req.body;
  console.log('[REPORTS] Generate request:', { reportType, staffId, startDate, endDate });

  try {
    const reportData = await getReportData(reportType, staffId, startDate, endDate);
    res.json(reportData);
  } catch (error) {
    console.error('[REPORTS] ERROR:', error);
    res.status(400).json({ error: error.message || 'Failed to generate report' });
  }
});
// POST /api/reports/export
router.post('/export', verifyToken, requireAdmin, async (req, res) => {
  const { format: exportFormat, reportType, staffId, startDate, endDate } = req.body;

  try {
    // SECURITY: Fetch data on the server based on filters, do not trust client data
    const reportData = await getReportData(reportType, staffId, startDate, endDate);
    const { appointments, summary } = reportData;

    if (exportFormat === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Appointments');

      worksheet.columns = [
        { header: 'Booking ID', key: 'id', width: 10 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Staff', key: 'staff', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 10 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Price', key: 'price', width: 10 }
      ];

      appointments.forEach(a => {
        worksheet.addRow({
          id: a.id,
          customer: a.customer_name,
          service: a.service_name,
          staff: a.staff_name || 'Unassigned',
          date: a.appointment_date,
          time: a.appointment_time,
          status: a.status,
          price: a.price
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=salon_report.xlsx');
      
      return await workbook.xlsx.write(res);
    } 
    
    if (exportFormat === 'pdf') {
      const doc = new PDFDocument();
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=salon_report.pdf');
        res.send(pdfData);
      });

      // PDF Content
      doc.fontSize(20).text('Salon Appointment Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Report Generated: ${new Date().toLocaleString()}`);
      doc.text(`Period: ${summary.dateRange.start} to ${summary.dateRange.end}`);
      doc.moveDown();

      doc.fontSize(16).text('Summary', { underline: true });
      doc.fontSize(12).text(`Total Appointments: ${summary.totalAppointments}`);
      doc.text(`Completed Appointments: ${summary.completedAppointments}`);
      doc.text(`Cancelled Appointments: ${summary.cancelledAppointments}`);
      doc.text(`Total Revenue: $${Number(summary.totalRevenue).toFixed(2)}`);
      doc.text(`Average Service Value: $${Number(summary.avgServiceValue).toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(16).text('Recent Appointments', { underline: true });
      doc.moveDown();

      appointments.slice(0, 50).forEach(a => {
        doc.fontSize(9).text(`${a.appointment_date} ${a.appointment_time} - ${a.customer_name} - ${a.service_name} - $${a.price} (${a.status})`);
      });

      if (appointments.length > 50) {
        doc.moveDown();
        doc.text(`... and ${appointments.length - 50} more appointments in the full dataset.`);
      }

      doc.end();
    } else {
      res.status(400).json({ error: 'Invalid export format' });
    }
  } catch (error) {
    console.error('[EXPORT] ERROR:', error);
    res.status(500).json({ error: 'Failed to export report', details: error.message });
  }
});

module.exports = router;
