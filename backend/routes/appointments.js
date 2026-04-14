const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken, requireAdminOrStaff } = require('../middleware/authMiddleware');

const fetchAppointmentWithDetails = async (appointmentId) => {
  return await db.getAsync(`
    SELECT 
      a.id, a.appointment_date, a.appointment_time, a.status, a.notes, a.price, a.rating, a.review, a.created_at, a.updated_at,
      cu.id as customer_id, cu.name as customer_name, cu.email as customer_email, cu.phone as customer_phone,
      su.id as staff_id, su.name as staff_name, su.email as staff_email,
      s.id as service_id, s.name as service_name, s.duration as service_duration, s.category as service_category
    FROM appointments a
    JOIN users cu ON a.customer_id = cu.id
    LEFT JOIN users su ON a.staff_id = su.id
    JOIN services s ON a.service_id = s.id
    WHERE a.id = ?
  `, [appointmentId]);
};

const mapAppointmentRow = (row) => ({
  id: row.id,
  customer: {
    id: row.customer_id,
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone
  },
  staff: row.staff_id ? {
    id: row.staff_id,
    name: row.staff_name,
    email: row.staff_email
  } : null,
  service: {
    id: row.service_id,
    name: row.service_name,
    duration: row.service_duration,
    category: row.service_category
  },
  appointment_date: row.appointment_date,
  appointment_time: row.appointment_time,
  status: row.status,
  notes: row.notes,
  price: row.price,
  rating: row.rating,
  review: row.review,
  created_at: row.created_at,
  updated_at: row.updated_at
});


// GET /api/appointments
router.get('/', verifyToken, async (req, res) => {
  const { status, date, date_from, date_to } = req.query;
  const user = req.user;

  try {
    let query = `
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.status, a.notes, a.price, a.rating, a.review, a.created_at, a.updated_at,
        cu.id as customer_id, cu.name as customer_name, cu.email as customer_email, cu.phone as customer_phone,
        su.id as staff_id, su.name as staff_name, su.email as staff_email,
        s.id as service_id, s.name as service_name, s.duration as service_duration, s.category as service_category
      FROM appointments a
      JOIN users cu ON a.customer_id = cu.id
      LEFT JOIN users su ON a.staff_id = su.id
      JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // RBAC scopes
    if (user.role === 'customer') {
      query += " AND a.customer_id = ?";
      params.push(user.user_id);
    } else if (user.role === 'staff') {
      query += " AND a.staff_id = ?";
      params.push(user.user_id);
    }

    // Query filters
    if (status) {
      query += " AND a.status = ?";
      params.push(status);
    }
    if (date) {
      query += " AND a.appointment_date = ?";
      params.push(date);
    }
    if (date_from) {
      query += " AND a.appointment_date >= ?";
      params.push(date_from);
    }
    if (date_to) {
      query += " AND a.appointment_date <= ?";
      params.push(date_to);
    }
    
    query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    const rows = await db.allAsync(query, params);
    res.json(rows.map(mapAppointmentRow));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const row = await fetchAppointmentWithDetails(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // RBAC validation
    if (req.user.role === 'customer' && row.customer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }
    if (req.user.role === 'staff' && row.staff_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }

    res.json(mapAppointmentRow(row));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments
router.post('/', verifyToken, async (req, res) => {
  const { service_id, staff_id, appointment_date, appointment_time, notes } = req.body;
  if (!service_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Service ID, date, and time are required' });
  }

  // Prevent past dates
  const reqDate = new Date(`${appointment_date}T${appointment_time}`);
  if (reqDate < new Date()) {
    return res.status(400).json({ error: 'Cannot book appointment in the past' });
  }

  try {
    // Validate service
    const service = await db.getAsync("SELECT price, is_active FROM services WHERE id = ?", [service_id]);
    if (!service || !service.is_active) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    // Checking overlaps 
    if (staff_id) {
      const conflict = await db.getAsync(`
        SELECT id FROM appointments 
        WHERE staff_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'
      `, [staff_id, appointment_date, appointment_time]);
      if (conflict) {
        return res.status(409).json({ error: 'Staff is not available at this time' });
      }
    }

    const customer_id = req.user.role === 'customer' ? req.user.user_id : req.body.customer_id; // Support admins booking for clients later

    const result = await db.runAsync(`
      INSERT INTO appointments (customer_id, staff_id, service_id, appointment_date, appointment_time, notes, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [customer_id, staff_id || null, service_id, appointment_date, appointment_time, notes, service.price]);

    const newRow = await fetchAppointmentWithDetails(result.lastID);
    res.status(201).json(mapAppointmentRow(newRow));
  } catch (error) {
    console.error("DEBUG APPOINTMENT BOOKING:", error);
    res.status(500).json({ error: error.message || 'Failed to book appointment' });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status, notes } = req.body;
  
  try {
    const row = await db.getAsync("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Appointment not found' });
    
    // RBAC
    if (req.user.role === 'customer' && (row.customer_id !== req.user.user_id || status !== 'cancelled' || row.status !== 'pending')) {
      return res.status(403).json({ error: 'Not authorized to update this appointment to ' + status });
    }
    if (req.user.role === 'staff' && row.staff_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled']
    };

    if (req.user.role !== 'admin' && (!transitions[row.status] || !transitions[row.status].includes(status))) {
      return res.status(400).json({ error: `Cannot change status from ${row.status} to ${status}` });
    }

    await db.runAsync(
      "UPDATE appointments SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, notes, req.params.id]
    );

    const updatedRow = await fetchAppointmentWithDetails(req.params.id);
    
    // If completing the appointment, give the user loyalty points!
    if (status === 'completed' && row.status !== 'completed') {
      await db.runAsync("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?", [Math.floor(row.price), row.customer_id]);
    }
    
    res.json(mapAppointmentRow(updatedRow));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// POST /api/appointments/:id/review
router.post('/:id/review', verifyToken, async (req, res) => {
  const { rating, review } = req.body;
  
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can leave reviews' });
  }

  try {
    const apt = await db.getAsync("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!apt) return res.status(404).json({ error: "Appointment not found" });
    if (apt.customer_id !== req.user.user_id) return res.status(403).json({ error: "Not authorized" });
    if (apt.status !== 'completed') return res.status(400).json({ error: "Can only review completed appointments" });

    await db.runAsync("UPDATE appointments SET rating = ?, review = ? WHERE id = ?", [rating, review, req.params.id]);
    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', requireAdminOrStaff, async (req, res) => {
  // Omitted complex rescheduling constraints for brevity, updating directly
  try {
    const { appointment_date, appointment_time, staff_id, notes } = req.body;
    await db.runAsync(
      `UPDATE appointments SET
        appointment_date = COALESCE(?, appointment_date),
        appointment_time = COALESCE(?, appointment_time),
        staff_id = COALESCE(?, staff_id),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [appointment_date, appointment_time, staff_id, notes, req.params.id]
    );
    const updated = await fetchAppointmentWithDetails(req.params.id);
    res.json(mapAppointmentRow(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment details' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', requireAdminOrStaff, async (req, res) => {
  try {
    const apt = await db.getAsync("SELECT id FROM appointments WHERE id = ?", [req.params.id]);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    await db.runAsync("DELETE FROM appointments WHERE id = ?", [req.params.id]);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;
