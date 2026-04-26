const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Appointment } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ---------- Helpers ----------

const formatDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

async function getReportData(reportType, staffId, startDate, endDate) {
  const now = new Date();
  let start, end;

  if (reportType === 'daily') {
    start = end = formatDate(now);
  } else if (reportType === 'weekly') {
    const six = new Date(now); six.setDate(now.getDate() - 6);
    start = formatDate(six); end = formatDate(now);
  } else if (reportType === 'monthly') {
    const som = new Date(now.getFullYear(), now.getMonth(), 1);
    start = formatDate(som); end = formatDate(now);
  } else if (reportType === 'custom') {
    if (!startDate || !endDate) throw new Error('Start date and end date are required for custom reports');
    const s = new Date(startDate), e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) throw new Error('Invalid date format provided');
    if (s > e) throw new Error('Start date must be before or equal to end date');

    // ✅ FIX STB-009: cap range at 366 days to prevent OOM crash
    const MAX_DAYS = 366;
    const diffDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_DAYS) throw new Error(`Date range too large. Maximum allowed range is ${MAX_DAYS} days.`);

    start = startDate; end = endDate;
  } else {
    throw new Error('Invalid report parameters');
  }

  const filter = { appointmentDate: { $gte: start, $lte: end } };
  if (staffId && staffId !== 'all') {
    if (!mongoose.Types.ObjectId.isValid(staffId)) throw new Error('Invalid staff ID provided');
    filter.staffId = new mongoose.Types.ObjectId(staffId);
  }

  const docs = await Appointment.find(filter)
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .populate('customerId', 'name')
    .populate('staffId', 'name')
    .populate('serviceId', 'name');

  const rows = docs.map(a => ({
    id: a._id.toString(),
    appointment_date: a.appointmentDate,
    appointment_time: a.appointmentTime,
    status: a.status,
    price: a.price,
    notes: a.notes,
    original_amount: a.originalAmount ?? a.price ?? 0,
    discount_amount: a.discountAmount ?? 0,
    final_amount: a.finalAmount ?? a.price ?? 0,
    discount_type: a.discountType,
    customer_name: a.customerId?.name || 'Unknown',
    staff_name: a.staffId?.name || null,
    service_name: a.serviceId?.name || 'Unknown',
  }));

  const completed = rows.filter(r => r.status === 'completed');
  const cancelled = rows.filter(r => r.status === 'cancelled');
  const totalRevenue = completed.reduce((s, r) => s + Number(r.final_amount || 0), 0);
  const totalDiscount = completed.reduce((s, r) => s + Number(r.discount_amount || 0), 0);
  const grossRevenue = completed.reduce((s, r) => s + Number(r.original_amount || 0), 0);
  const avgServiceValue = completed.length > 0 ? totalRevenue / completed.length : 0;

  const serviceCounts = {};
  rows.forEach(r => { if (r.service_name) serviceCounts[r.service_name] = (serviceCounts[r.service_name] || 0) + 1; });
  const mostBookedServices = Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    summary: {
      totalAppointments: rows.length,
      completedAppointments: completed.length,
      cancelledAppointments: cancelled.length,
      totalRevenue, totalDiscount, grossRevenue, avgServiceValue,
      dateRange: { start, end },
    },
    mostBookedServices,
    appointments: rows,
  };
}

// POST /api/reports/generate
router.post('/generate', requireAdmin, async (req, res) => {
  const { reportType, staffId, startDate, endDate } = req.body;
  try {
    const reportData = await getReportData(reportType, staffId, startDate, endDate);
    res.json(reportData);
  } catch (error) {
    console.error('[REPORTS] ERROR:', error);
    res.status(400).json({ error: error.message || 'Failed to generate report' });
  }
});

// POST /api/reports/export
router.post('/export', requireAdmin, async (req, res) => {
  const { format: exportFormat, reportType, staffId, startDate, endDate } = req.body;
  try {
    const reportData = await getReportData(reportType, staffId, startDate, endDate);
    const { appointments, summary } = reportData;

    if (exportFormat === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Appointments');
      worksheet.columns = [
        { header: 'Booking ID', key: 'id', width: 26 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'Staff', key: 'staff', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 10 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Original', key: 'original_amount', width: 10 },
        { header: 'Discount', key: 'discount_amount', width: 10 },
        { header: 'Final Revenue', key: 'final_amount', width: 15 },
      ];
      appointments.forEach(a => worksheet.addRow({
        id: a.id,
        customer: a.customer_name,
        service: a.service_name,
        staff: a.staff_name || 'Unassigned',
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        original_amount: a.original_amount,
        discount_amount: a.discount_amount,
        final_amount: a.final_amount,
      }));

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=salon_report.xlsx');
      return await workbook.xlsx.write(res);
    }

    if (exportFormat === 'pdf') {
      const doc = new PDFDocument();
      const buffers = [];
      doc.on('data', b => buffers.push(b));
      doc.on('end', () => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=salon_report.pdf');
        res.send(Buffer.concat(buffers));
      });

      doc.fontSize(20).text('Salon Appointment Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Report Generated: ${new Date().toLocaleString()}`);
      doc.text(`Period: ${summary.dateRange.start} to ${summary.dateRange.end}`);
      doc.moveDown();
      doc.fontSize(16).text('Summary', { underline: true });
      doc.fontSize(12).text(`Total Appointments: ${summary.totalAppointments}`);
      doc.text(`Completed: ${summary.completedAppointments}`);
      doc.text(`Cancelled: ${summary.cancelledAppointments}`);
      doc.moveDown();
      doc.text(`Gross Revenue: $${Number(summary.grossRevenue).toFixed(2)}`);
      doc.text(`Total Discount Given: -$${Number(summary.totalDiscount).toFixed(2)}`);
      doc.fontSize(14).text(`Total Net Revenue: $${Number(summary.totalRevenue).toFixed(2)}`);
      doc.fontSize(12).text(`Average Service Value: $${Number(summary.avgServiceValue).toFixed(2)}`);
      doc.moveDown();
      doc.fontSize(16).text('Recent Appointments', { underline: true });
      doc.moveDown();
      appointments.slice(0, 50).forEach(a => {
        doc.fontSize(9).text(`${a.appointment_date} ${a.appointment_time} - ${a.customer_name} - ${a.service_name} - Orig: $${a.original_amount} Disc: -$${a.discount_amount} Final: $${a.final_amount} (${a.status})`);
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
    res.status(500).json({
      error: 'Failed to export report',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

module.exports = router;
