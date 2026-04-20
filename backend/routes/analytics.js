const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/authMiddleware');

// Validates requireAdmin middleware enforces endpoint only executes for admin-role.

// GET /api/analytics/dashboard-stats
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const aptQuery = await db.getAsync("SELECT COUNT(*) as cnt FROM appointments WHERE appointment_date = ?", [today]);
    const todayAppointments = aptQuery.cnt;

    const revQuery = await db.getAsync("SELECT SUM(price) as total FROM appointments WHERE appointment_date = ? AND status = 'completed'", [today]);
    const todayRevenue = revQuery.total || 0;

    const staffQuery = await db.getAsync(`
      SELECT COUNT(*) as cnt FROM staff_profiles sp JOIN users u ON u.id = sp.user_id 
      WHERE u.role = 'staff' AND sp.is_available = 1
    `);
    const activeStaff = staffQuery.cnt;

    // Compute real month-over-month growth rate
    const thisMonthQuery = await db.getAsync(
      "SELECT COUNT(*) as cnt FROM appointments WHERE strftime('%Y-%m', appointment_date) = strftime('%Y-%m', 'now')"
    );
    const lastMonthQuery = await db.getAsync(
      "SELECT COUNT(*) as cnt FROM appointments WHERE strftime('%Y-%m', appointment_date) = strftime('%Y-%m', date('now', '-1 month'))"
    );
    const thisMonth = thisMonthQuery.cnt || 0;
    const lastMonth = lastMonthQuery.cnt || 0;
    let growthRate = 0;
    if (lastMonth === 0 && thisMonth > 0) {
      growthRate = 100; // Cap at 100% when starting from zero
    } else if (lastMonth > 0) {
      growthRate = parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1));
    }

    res.json({
      todayAppointments,
      todayRevenue,
      activeStaff,
      growthRate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/analytics/weekly-data
router.get('/weekly-data', requireAdmin, async (req, res) => {
  try {
    const data = await db.allAsync(`
      SELECT 
        strftime('%w', appointment_date) as weekday,
        COUNT(*) as appointments,
        SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as revenue
      FROM appointments 
      WHERE appointment_date >= date('now', '-6 days')
      GROUP BY weekday
    `);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyFormat = [
      { day: 'Mon', appointments: 0, revenue: 0 },
      { day: 'Tue', appointments: 0, revenue: 0 },
      { day: 'Wed', appointments: 0, revenue: 0 },
      { day: 'Thu', appointments: 0, revenue: 0 },
      { day: 'Fri', appointments: 0, revenue: 0 },
      { day: 'Sat', appointments: 0, revenue: 0 },
      { day: 'Sun', appointments: 0, revenue: 0 }
    ];

    data.forEach(row => {
      const dayName = dayNames[parseInt(row.weekday)];
      const target = weeklyFormat.find(d => d.day === dayName);
      if (target) {
        target.appointments = row.appointments;
        target.revenue = row.revenue || 0;
      }
    });

    res.json(weeklyFormat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly data' });
  }
});

// GET /api/analytics/service-distribution
router.get('/service-distribution', requireAdmin, async (req, res) => {
  try {
    const categories = ['Hair', 'Facial', 'Nails', 'Massage', 'Wellness', 'Beauty'];
    const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#3b82f6'];

    const data = await db.allAsync(`
      SELECT category as name, COUNT(*) as value 
      FROM services 
      GROUP BY category
    `);

    const formatted = categories.map((cat, index) => {
      const match = data.find(d => d.name === cat);
      return {
        name: cat,
        value: match ? match.value : 0,
        color: colors[index % colors.length]
      };
    });
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distribution metrics' });
  }
});

// GET /api/analytics/staff-performance
router.get('/staff-performance', requireAdmin, async (req, res) => {
  try {
    const data = await db.allAsync(`
      SELECT 
        u.id, u.name, sp.specialty as role, sp.rating,
        COUNT(a.id) as appointments,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END) as revenue
      FROM users u
      JOIN staff_profiles sp ON strftime('%Y', 'now') = strftime('%Y', 'now') AND sp.user_id = u.id
      LEFT JOIN appointments a ON u.id = a.staff_id
      WHERE u.role = 'staff'
      GROUP BY u.id
    `);

    const formatted = data.map(d => ({
      ...d,
      revenue: d.revenue || 0,
      completion_rate: d.appointments > 0 ? parseFloat(((d.completed / d.appointments) * 100).toFixed(1)) : 0
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff metrics' });
  }
});

// GET /api/analytics/service-performance
router.get('/service-performance', requireAdmin, async (req, res) => {
  try {
    const data = await db.allAsync(`
      SELECT 
        s.id as service_id, s.name as service_name, s.category, s.price as base_price,
        COUNT(a.id) as total_bookings,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN a.status = 'completed' THEN a.price ELSE 0 END) as total_revenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
      GROUP BY s.id
      ORDER BY total_bookings DESC
    `);

    const formatted = data.map(d => ({
      ...d,
      completed_bookings: d.completed_bookings || 0,
      total_revenue: d.total_revenue || 0,
      average_revenue: d.completed_bookings > 0 ? parseFloat((d.total_revenue / d.completed_bookings).toFixed(2)) : 0,
      completion_rate: d.total_bookings > 0 ? parseFloat(((d.completed_bookings / d.total_bookings) * 100).toFixed(1)) : 0
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service performance metrics' });
  }
});

// GET /api/analytics/monthly-revenue
// Returns last 6 calendar months of appointment counts + revenue for the Revenue Trends chart
router.get('/monthly-revenue', requireAdmin, async (req, res) => {
  try {
    const data = await db.allAsync(`
      SELECT 
        strftime('%Y-%m', appointment_date) as month_key,
        COUNT(*) as appointments,
        SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) as revenue
      FROM appointments
      WHERE appointment_date >= date('now', '-5 months', 'start of month')
      GROUP BY month_key
      ORDER BY month_key ASC
    `);

    // Build a full 6-month scaffold so missing months still appear as 0
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentUTCMonth = now.getUTCMonth();
    const currentUTCYear = now.getUTCFullYear();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(currentUTCYear, currentUTCMonth - i, 1));
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      months.push({ month: monthNames[d.getUTCMonth()], month_key: key, appointments: 0, revenue: 0 });
    }

    // Merge real data into scaffold
    data.forEach(row => {
      const target = months.find(m => m.month_key === row.month_key);
      if (target) {
        target.appointments = row.appointments;
        target.revenue = row.revenue || 0;
      }
    });

    // Strip internal month_key before sending
    res.json(months.map(({ month, appointments, revenue }) => ({ month, appointments, revenue })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly revenue data' });
  }
});

module.exports = router;
