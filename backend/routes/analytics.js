const express = require('express');
const router = express.Router();
const { Appointment, StaffProfile, User } = require('../db');
const { requireAdmin } = require('../middleware/authMiddleware');

// Helper: "YYYY-MM-DD" string from a Date object
const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper: "YYYY-MM" month prefix
const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// GET /api/analytics/dashboard-stats
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
  try {
    const today = fmtDate(new Date());

    const todayAppointments = await Appointment.countDocuments({ appointmentDate: today });

    const revAgg = await Appointment.aggregate([
      { $match: { appointmentDate: today, status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalAmount', '$price'] } } } },
    ]);
    const todayRevenue = revAgg[0]?.total || 0;

    const activeStaff = await StaffProfile.countDocuments({ isAvailable: true });

    const now = new Date();
    const thisMonthPrefix = fmtMonth(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = fmtMonth(lastMonthDate);

    const thisMonth = await Appointment.countDocuments({ appointmentDate: { $regex: `^${thisMonthPrefix}` } });
    const lastMonth = await Appointment.countDocuments({ appointmentDate: { $regex: `^${lastMonthPrefix}` } });

    let growthRate = 0;
    if (lastMonth === 0 && thisMonth > 0) growthRate = 100;
    else if (lastMonth > 0) growthRate = parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1));

    res.json({ todayAppointments, todayRevenue, activeStaff, growthRate });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/analytics/weekly-data
router.get('/weekly-data', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(now.getDate() - 6);
    const fromDate = fmtDate(sixDaysAgo);
    const toDate = fmtDate(now);

    const raw = await Appointment.find({ appointmentDate: { $gte: fromDate, $lte: toDate } });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyFormat = [
      { day: 'Mon', appointments: 0, revenue: 0 },
      { day: 'Tue', appointments: 0, revenue: 0 },
      { day: 'Wed', appointments: 0, revenue: 0 },
      { day: 'Thu', appointments: 0, revenue: 0 },
      { day: 'Fri', appointments: 0, revenue: 0 },
      { day: 'Sat', appointments: 0, revenue: 0 },
      { day: 'Sun', appointments: 0, revenue: 0 },
    ];

    raw.forEach(a => {
      const d = new Date(a.appointmentDate + 'T00:00:00');
      const name = dayNames[d.getDay()];
      const slot = weeklyFormat.find(w => w.day === name);
      if (slot) {
        slot.appointments++;
        if (a.status === 'completed') slot.revenue += a.finalAmount || 0;
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
    const CATEGORIES = ['Hair', 'Facial', 'Nails', 'Massage', 'Wellness', 'Beauty'];
    const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#3b82f6'];

    const { Service } = require('../db');
    const agg = await Service.aggregate([{ $group: { _id: '$category', value: { $sum: 1 } } }]);
    const countMap = {};
    agg.forEach(r => { countMap[r._id] = r.value; });

    res.json(CATEGORIES.map((cat, i) => ({ name: cat, value: countMap[cat] || 0, color: COLORS[i % COLORS.length] })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distribution metrics' });
  }
});

// GET /api/analytics/staff-performance
// ✅ FIX STB-007: replaced 3 separate DB round-trips with a single $lookup aggregation pipeline
router.get('/staff-performance', requireAdmin, async (req, res) => {
  try {
    const results = await User.aggregate([
      // Step 1: only staff users
      { $match: { role: 'staff' } },

      // Step 2: join their StaffProfile
      {
        $lookup: {
          from: 'staffprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      // preserveNullAndEmpty keeps staff without a profile in results
      { $unwind: { path: '$profile', preserveNullAndEmpty: true } },

      // Step 3: join their Appointments
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'staffId',
          as: 'appointments',
        },
      },

      // Step 4: compute stats inline — no extra round-trip
      {
        $addFields: {
          total_appointments: { $size: '$appointments' },
          completed: {
            $size: {
              $filter: {
                input: '$appointments',
                as: 'a',
                cond: { $eq: ['$$a.status', 'completed'] },
              },
            },
          },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$appointments',
                    as: 'a',
                    cond: { $eq: ['$$a.status', 'completed'] },
                  },
                },
                as: 'a',
                in: { $ifNull: ['$$a.finalAmount', 0] },
              },
            },
          },
        },
      },

      // Step 5: project only the fields we need — drop raw appointments array
      {
        $project: {
          _id: 1,
          name: 1,
          specialty: '$profile.specialty',
          rating: '$profile.rating',
          total_appointments: 1,
          completed: 1,
          revenue: 1,
        },
      },
    ]);

    const formatted = results.map(u => ({
      id: u._id.toString(),
      name: u.name,
      role: u.specialty || '',
      rating: u.rating || 0,
      appointments: u.total_appointments,
      completed: u.completed,
      revenue: u.revenue || 0,
      completion_rate: u.total_appointments > 0
        ? parseFloat(((u.completed / u.total_appointments) * 100).toFixed(1))
        : 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[ANALYTICS] Staff performance error:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff metrics' });
  }
});

// GET /api/analytics/service-performance
router.get('/service-performance', requireAdmin, async (req, res) => {
  try {
    const { Service } = require('../db');
    const services = await Service.find();

    const agg = await Appointment.aggregate([
      { $match: { serviceId: { $in: services.map(s => s._id) } } },
      {
        $group: {
          _id: '$serviceId',
          total_bookings: { $sum: 1 },
          completed_bookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          total_revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$finalAmount', 0] } },
        },
      },
    ]);
    const aggMap = {};
    agg.forEach(r => { aggMap[r._id.toString()] = r; });

    const formatted = services.map(s => {
      const stats = aggMap[s._id.toString()] || { total_bookings: 0, completed_bookings: 0, total_revenue: 0 };
      return {
        service_id: s._id.toString(),
        service_name: s.name,
        category: s.category,
        base_price: s.price,
        total_bookings: stats.total_bookings,
        completed_bookings: stats.completed_bookings,
        total_revenue: stats.total_revenue || 0,
        average_revenue: stats.completed_bookings > 0
          ? parseFloat((stats.total_revenue / stats.completed_bookings).toFixed(2))
          : 0,
        completion_rate: stats.total_bookings > 0
          ? parseFloat(((stats.completed_bookings / stats.total_bookings) * 100).toFixed(1))
          : 0,
      };
    }).sort((a, b) => b.total_bookings - a.total_bookings);

    res.json(formatted);
  } catch (error) {
    console.error('[ANALYTICS] Service performance error:', error.message);
    res.status(500).json({ error: 'Failed to fetch service performance metrics' });
  }
});

// GET /api/analytics/monthly-revenue
router.get('/monthly-revenue', requireAdmin, async (req, res) => {
  try {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Build scaffold for last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fmtMonth(d);
      months.push({ month: monthNames[d.getMonth()], month_key: key, appointments: 0, revenue: 0 });
    }

    const fromKey = months[0].month_key;
    const raw = await Appointment.find({ appointmentDate: { $gte: fromKey + '-01' } });

    raw.forEach(a => {
      const key = a.appointmentDate.substring(0, 7);
      const slot = months.find(m => m.month_key === key);
      if (slot) {
        slot.appointments++;
        if (a.status === 'completed') slot.revenue += a.finalAmount || 0;
      }
    });

    res.json(months.map(({ month, appointments, revenue }) => ({ month, appointments, revenue })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly revenue data' });
  }
});

module.exports = router;