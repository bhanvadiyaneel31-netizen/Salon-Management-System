const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken, requireAdmin, requireAdminOrStaff } = require('../middleware/authMiddleware');
const { sendAppointmentEmail } = require('../services/emailService');


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

// GET /api/appointments/slots
router.get('/slots', async (req, res) => {
  const { date, staff_id, service_id, exclude_appointment_id } = req.query;
  const sid = parseInt(service_id);
  const stid = parseInt(staff_id);
  const skipId = exclude_appointment_id ? parseInt(exclude_appointment_id) : null;

  if (!date || isNaN(stid) || isNaN(sid)) {
    return res.status(400).json({ error: 'Valid date, staff_id, and service_id are required' });
  }

  try {
    // Fetch service for duration
    const service = await db.getAsync("SELECT is_active, duration FROM services WHERE id = ?", [sid]);
    if (!service || !service.is_active) {
      return res.status(400).json({ error: 'This service is currently inactive' });
    }
    const requestedDuration = service.duration || 30;

    // Check if staff is active
    const staff = await db.getAsync("SELECT is_available FROM staff_profiles WHERE user_id = ?", [stid]);
    if (!staff || !staff.is_available) {
      return res.status(400).json({ error: 'This staff member is currently inactive' });
    }

    // Generate dynamic slots based on duration
    const startHour = 10; // 10:00 AM
    const endHour = 21;   // 09:00 PM
    const allSlots = [];
    let currentMin = startHour * 60;
    const maxMin = endHour * 60;

    while (currentMin + requestedDuration <= maxMin) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      currentMin += requestedDuration;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = date === todayStr;

    let query = `
      SELECT appointment_time, s.duration
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.staff_id = ? AND a.appointment_date = ? AND a.status != 'cancelled'
    `;
    let params = [stid, date];

    if (skipId) {
      query += " AND a.id != ?";
      params.push(skipId);
    }

    const appointments = await db.allAsync(query, params);


    const blockedMinuteRanges = appointments.map(a => {
      const [h, m] = a.appointment_time.substring(0, 5).split(':').map(Number);
      const start = h * 60 + m;
      return { start, end: start + (a.duration || 30) };
    });

    const availableSlots = allSlots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      
      // Filter past slots for today with buffer
      if (isToday && slotMinutes <= nowMinutes + 15) return false;
      
      // Filter slots that overlap with any existing booking
      const slotEnd = slotMinutes + requestedDuration;
      for (const range of blockedMinuteRanges) {
        if (slotMinutes < range.end && slotEnd > range.start) return false;
      }
      return true;
    });
    
    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
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

  // Prevent past dates and times with a small buffer for processing time
  const now = new Date();
  const [hours, minutes] = appointment_time.split(':').map(Number);
  const bookingDate = new Date(appointment_date);
  bookingDate.setHours(hours, minutes, 0, 0);
  
  // 5 minute grace period for submission latency
  if (bookingDate.getTime() < now.getTime() - (5 * 60 * 1000)) {
    return res.status(400).json({ error: 'Cannot book appointment in the past' });
  }

  try {
    // Validate service — fetch category too for category-based staff matching
    const service = await db.getAsync("SELECT id, name, price, is_active, duration, category FROM services WHERE id = ?", [service_id]);
    if (!service || !service.is_active) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }
    const requestedDuration = service.duration || 30;

    // Validate that the requested time is a valid dynamic slot starting from 10:00
    const startHour = 10;
    const endHour = 21;
    const reqMinutes = hours * 60 + minutes;
    
    // Check if within business hours and doesn't overflow closing time
    if (reqMinutes < startHour * 60 || reqMinutes + requestedDuration > endHour * 60) {
      return res.status(400).json({ 
        error: `Selected time is outside business hours (10:00 - 21:00) or service overflows closing time.` 
      });
    }

    // Check if it matches a duration-based slot
    const offsetFromStart = reqMinutes - (startHour * 60);
    if (offsetFromStart % requestedDuration !== 0) {
      return res.status(400).json({ 
        error: `Invalid time slot for this service. Slots for ${service.name} (${requestedDuration} min) must start at ${requestedDuration} minute intervals from 10:00.` 
      });
    }

    // Validate staff availability and conflicts
    if (staff_id) {
      const staffProfile = await db.getAsync(`
        SELECT sp.is_available, sp.category
        FROM staff_profiles sp
        WHERE sp.user_id = ?
      `, [staff_id]);
      if (!staffProfile || !staffProfile.is_available) {
        return res.status(400).json({ error: 'This staff member is currently inactive' });
      }

      // Category-based validation: staff.category must match service.category
      // Only enforce if both sides have category data (guard against legacy NULL rows)
      if (service.category && staffProfile.category && staffProfile.category !== service.category) {
        return res.status(400).json({
          error: `This staff member handles ${staffProfile.category} services, not ${service.category}`
        });
      }

      // Duration-aware overlap check — block if any existing booking overlaps the requested slot
      const reqMinutes = (() => {
        const [h, m] = appointment_time.split(':').map(Number);
        return h * 60 + m;
      })();
      const reqEnd = reqMinutes + service.duration;

      const existingBookings = await db.allAsync(`
        SELECT a.appointment_time, s.duration
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.staff_id = ? AND a.appointment_date = ? AND a.status != 'cancelled'
      `, [staff_id, appointment_date]);

      for (const booking of existingBookings) {
        const [h, m] = booking.appointment_time.substring(0, 5).split(':').map(Number);
        const existStart = h * 60 + m;
        const existEnd = existStart + (booking.duration || 30);
        if (reqMinutes < existEnd && reqEnd > existStart) {
          return res.status(409).json({ error: 'This staff is already booked during this time slot' });
        }
      }
    }

    const customer_id = req.user.role === 'customer' ? req.user.user_id : req.body.customer_id; // Support admins booking for clients later

    const result = await db.runAsync(`
      INSERT INTO appointments (customer_id, staff_id, service_id, appointment_date, appointment_time, notes, price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [customer_id, staff_id || null, service_id, appointment_date, appointment_time, notes, service.price]);

    // Notify Staff if assigned
    if (staff_id) {
      await db.runAsync(
        "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
        [staff_id, 'New Appointment', `New booking for ${service.name} on ${appointment_date} at ${appointment_time}`, 'new_appointment', result.lastID]
      );
    }

    const newRow = await fetchAppointmentWithDetails(result.lastID);
    
    // Send background email notification
    sendAppointmentEmail({
      to: newRow.customer_email,
      customerName: newRow.customer_name,
      serviceName: newRow.service_name,
      status: 'pending',
      date: newRow.appointment_date,
      time: newRow.appointment_time,
      staffName: newRow.staff_name,
      type: 'booked'
    });

    res.status(201).json(mapAppointmentRow(newRow));

  } catch (error) {
    console.error("DEBUG APPOINTMENT BOOKING:", error);
    res.status(500).json({ error: "DEBUG: " + (error.message || JSON.stringify(error) || String(error)) });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status, notes } = req.body;
  
  try {
    const row = await db.getAsync("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Appointment not found' });
    
    // RBAC & Ownership
    if (req.user.role === 'customer') {
      if (row.customer_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Not authorized to access this appointment' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Customers can only cancel their own appointments' });
      }
      if (row.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending appointments can be cancelled by customers' });
      }
    } else if (req.user.role === 'staff') {
      if (row.staff_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Not authorized to manage this appointment' });
      }
      const allowedStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ error: 'Unauthorized status transition for staff' });
      }
    }

    // State machine transitions
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled']
    };

    if (req.user.role !== 'admin' && (!transitions[row.status] || !transitions[row.status].includes(status))) {
      return res.status(400).json({ error: `Cannot change status from ${row.status} to ${status}` });
    }

    await db.runAsync(
      "UPDATE appointments SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, notes, req.params.id]
    );

    const updatedRow = await fetchAppointmentWithDetails(req.params.id);
    if (!updatedRow) return res.status(404).json({ error: 'Appointment not found after update' });

    // Notify Customer — use flat column names from the raw DB row
    await db.runAsync(
      "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
      [updatedRow.customer_id, `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`, `Your appointment for ${updatedRow.service_name} has been ${status}.`, 'update', updatedRow.id]
    );

    // Notify Staff
    if (updatedRow.staff_id) {
      await db.runAsync(
        "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
        [updatedRow.staff_id, 'Status Update', `Appointment for ${updatedRow.customer_name} is now ${status}.`, 'update', updatedRow.id]
      );
    }
    
    // If completing the appointment, award customer loyalty points
    if (status === 'completed' && row.status !== 'completed') {
      await db.runAsync("UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?", [Math.floor(row.price), row.customer_id]);
    }
    
    // Send background email notification if status changed
    if (row.status !== status) {
      const emailType = status === 'confirmed' ? 'confirmed' : 
                        status === 'completed' ? 'completed' : 
                        status === 'cancelled' ? 'cancelled' : 'update';
      
      sendAppointmentEmail({
        to: updatedRow.customer_email,
        customerName: updatedRow.customer_name,
        serviceName: updatedRow.service_name,
        status: status,
        date: updatedRow.appointment_date,
        time: updatedRow.appointment_time,
        staffName: updatedRow.staff_name,
        type: emailType
      });
    }
    
    res.json(mapAppointmentRow(updatedRow));

  } catch (error) {
    console.error('[STATUS UPDATE ERROR]', error.message);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// POST /api/appointments/:id/review
router.post('/:id/review', verifyToken, async (req, res) => {
  const { rating, review } = req.body;

  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Only customers can leave reviews' });
  }

  // Coerce to number first — this catches strings like "abc" (→ NaN) and rejects them
  const ratingNum = Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
  }
  // Round to nearest integer (1–5 are whole stars; reject e.g. 3.7 by rounding to integer)
  const ratingInt = Math.round(ratingNum);

  try {
    const apt = await db.getAsync("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!apt) return res.status(404).json({ error: "Appointment not found" });
    if (apt.customer_id !== req.user.user_id) return res.status(403).json({ error: "Not authorized" });
    if (apt.status !== 'completed') return res.status(400).json({ error: "Can only review completed appointments" });

    // Save the review on the appointment — use ratingInt (number, not raw string)
    await db.runAsync(
      "UPDATE appointments SET rating = ?, review = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [ratingInt, review, req.params.id]
    );

    // Recalculate and persist the staff member's average rating if staff was assigned
    let newAvgRating = null;
    if (apt.staff_id) {
      const avgRow = await db.getAsync(`
        SELECT ROUND(AVG(CAST(rating AS REAL)), 2) AS avg_rating,
               COUNT(*) AS review_count
        FROM appointments
        WHERE staff_id = ? AND rating IS NOT NULL AND status = 'completed'
      `, [apt.staff_id]);

      if (avgRow && avgRow.avg_rating !== null) {
        newAvgRating = avgRow.avg_rating;
        await db.runAsync(
          "UPDATE staff_profiles SET rating = ? WHERE user_id = ?",
          [newAvgRating, apt.staff_id]
        );
      }
    }

    res.json({
      message: "Review submitted successfully",
      staff_rating: newAvgRating
    });
  } catch (error) {
    console.error('[REVIEW ERROR]', error.message);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const row = await db.getAsync("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Appointment not found' });

    // RBAC: Admin can do anything. Staff can update their own. Customers can reschedule their own IF pending.
    if (req.user.role === 'staff' && row.staff_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Not authorized to manage this appointment' });
    }
    if (req.user.role === 'customer') {
      if (row.customer_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (row.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending appointments can be rescheduled' });
      }
    }
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.role !== 'customer') {
       return res.status(403).json({ error: 'Unauthorized' });
    }

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

    // Fetch details to get customer/service info for notification
    const apt = await fetchAppointmentWithDetails(req.params.id);
    
      // Notify Customer
      if (apt) {
        await db.runAsync(
          "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
          [apt.customer_id, 'Appointment Updated', `Your appointment has been rescheduled/updated. Check details for changes.`, 'update', req.params.id]
        );
        
        // Send background email notification
        sendAppointmentEmail({
          to: apt.customer_email,
          customerName: apt.customer_name,
          serviceName: apt.service_name,
          status: apt.status,
          date: apt.appointment_date,
          time: apt.appointment_time,
          staffName: apt.staff_name,
          type: 'update'
        });

        // Notify new Staff if changed or assigned
        if (staff_id && staff_id !== apt.staff_id) {
           await db.runAsync(
            "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
            [staff_id, 'New Assignment', `You have been assigned to a new appointment on ${apt.appointment_date}.`, 'assignment', req.params.id]
          );
        }
      }

    const updated = await fetchAppointmentWithDetails(req.params.id);
    res.json(mapAppointmentRow(updated));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment details' });
  }
});

// PATCH /api/appointments/:id/reschedule
router.patch('/:id/reschedule', verifyToken, async (req, res) => {
  const { newDate, newTime } = req.body;
  
  if (!newDate || !newTime) {
    return res.status(400).json({ error: 'New date and time are required' });
  }

  try {
    // 1. Fetch current appointment details
    const apt = await fetchAppointmentWithDetails(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });

    // 2. RBAC: Customers can only reschedule their own PENDING appointments
    if (req.user.role === 'customer') {
      if (apt.customer_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (apt.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending appointments can be rescheduled by customers' });
      }
    }

    // 3. Prevent past dates/times
    const now = new Date();
    const [hours, minutes] = newTime.split(':').map(Number);
    const bookingDate = new Date(newDate);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    if (bookingDate.getTime() < now.getTime() - (5 * 60 * 1000)) { // 5 min grace
      return res.status(400).json({ error: 'Cannot reschedule to a past time' });
    }

    // 4. Validate Business Hours (10 AM - 9 PM)
    const startHour = 10;
    const endHour = 21;
    const reqMinutes = hours * 60 + minutes;
    const duration = apt.service_duration || 30;

    if (reqMinutes < startHour * 60 || reqMinutes + duration > endHour * 60) {
      return res.status(400).json({ error: 'Selected time is outside business hours (10:00 - 21:00)' });
    }

    // 5. Check Staff Availability (excluding THIS appointment's current slot)
    if (apt.staff_id) {
      const staff = await db.getAsync("SELECT is_available FROM staff_profiles WHERE user_id = ?", [apt.staff_id]);
      if (!staff || !staff.is_available) {
        return res.status(400).json({ error: 'Assigned staff is currently unavailable' });
      }

      const reqEnd = reqMinutes + duration;
      const existingBookings = await db.allAsync(`
        SELECT a.id, a.appointment_time, s.duration
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.staff_id = ? AND a.appointment_date = ? AND a.status != 'cancelled' AND a.id != ?
      `, [apt.staff_id, newDate, apt.id]);

      for (const booking of existingBookings) {
        const [h, m] = booking.appointment_time.substring(0, 5).split(':').map(Number);
        const existStart = h * 60 + m;
        const existEnd = existStart + (booking.duration || 30);
        if (reqMinutes < existEnd && reqEnd > existStart) {
          return res.status(409).json({ error: 'This staff member is already booked during this time' });
        }
      }
    }

    // 6. Update Database
    await db.runAsync(
      "UPDATE appointments SET appointment_date = ?, appointment_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newDate, newTime, req.params.id]
    );

    // 7. Notify Customer
    await db.runAsync(
      "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
      [apt.customer_id, 'Appointment Rescheduled', `Your appointment for ${apt.service_name} has been rescheduled to ${newDate} at ${newTime}.`, 'reschedule', apt.id]
    );

    // 8. Notify Staff
    if (apt.staff_id) {
      await db.runAsync(
        "INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)",
        [apt.staff_id, 'Appointment Rescheduled', `Appointment for ${apt.customer_name} has been rescheduled to ${newDate} at ${newTime}.`, 'reschedule', apt.id]
      );
    }

    // 9. Send Email
    sendAppointmentEmail({
      to: apt.customer_email,
      customerName: apt.customer_name,
      serviceName: apt.service_name,
      status: apt.status,
      date: newDate,
      time: newTime,
      staffName: apt.staff_name || 'Assigned Staff',
      type: 'reschedule'
    });

    const updated = await fetchAppointmentWithDetails(apt.id);
    res.json(mapAppointmentRow(updated));

  } catch (error) {
    console.error('[RESCHEDULE ERROR]', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', requireAdmin, async (req, res) => {

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
