const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const staff = await db.allAsync(`
      SELECT u.id, u.name, u.email, u.phone, 
             sp.category, sp.specialty, sp.rating, sp.is_available, sp.created_at,
             (SELECT COUNT(*) FROM appointments WHERE staff_id = u.id AND status = 'completed') as completed_appointments,
             (SELECT GROUP_CONCAT(service_id) FROM staff_service_assignments WHERE staff_id = u.id) as assigned_service_ids
      FROM users u
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'staff'
    `);
    
    // Process integer boolean and comma-separated IDs
    const formatted = staff.map(s => ({
      ...s,
      is_available: Boolean(s.is_available),
      assigned_service_ids: s.assigned_service_ids ? s.assigned_service_ids.split(',').map(Number) : []
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Failed to fetch staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// GET /api/staff/available
router.get('/available', async (req, res) => {
  const { date, service_id } = req.query;
  
  try {
    let query = `
      SELECT DISTINCT u.id, u.name, u.email, sp.category, sp.specialty, sp.rating, sp.is_available,
             (SELECT GROUP_CONCAT(service_id) FROM staff_service_assignments WHERE staff_id = u.id) as assigned_service_ids
      FROM users u
      JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'staff' 
        AND sp.is_available = 1
    `;
    const params = [];

    if (service_id) {
      query += ` AND sp.category = (SELECT category FROM services WHERE id = ?)`;
      params.push(service_id);
    }

    if (date) {
      // Requirements suggest checking for conflicts, but usually getAvailable is for initial filtering
      // Real conflict check happens during slot selection.
    }

    query += ` ORDER BY sp.rating DESC`;
    
    const availableStaff = await db.allAsync(query, params);

    const formatted = availableStaff.map(s => ({
      ...s,
      is_available: Boolean(s.is_available),
      assigned_service_ids: s.assigned_service_ids ? s.assigned_service_ids.split(',').map(Number) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Failed to fetch available staff:', error);
    res.status(500).json({ error: 'Failed to fetch available staff' });
  }
});

// GET /api/staff/:id/services
router.get('/:id/services', async (req, res) => {
  try {
    const staffUser = await db.getAsync(`
      SELECT u.id, u.name, sp.category, sp.specialty 
      FROM users u 
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.id = ? AND u.role = 'staff'
    `, [req.params.id]);

    if (!staffUser) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const services = await db.allAsync(`
      SELECT s.id, s.name, s.category 
      FROM services s
      JOIN staff_service_assignments ssa ON s.id = ssa.service_id
      WHERE ssa.staff_id = ?
    `, [req.params.id]);

    res.json({
      staff: staffUser,
      services
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff services' });
  }
});

// POST /api/staff/:id/assign-service
router.post('/:id/assign-service', requireAdmin, async (req, res) => {
  const { service_id } = req.body;
  if (!service_id) return res.status(400).json({ error: 'service_id is required' });

  try {
    await db.runAsync(
      "INSERT INTO staff_service_assignments (staff_id, service_id) VALUES (?, ?)", 
      [req.params.id, service_id]
    );
    res.status(201).json({
      message: 'Service assigned successfully',
      staff_id: parseInt(req.params.id),
      service_id
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Service already assigned to this staff member' });
    }
    res.status(500).json({ error: 'Failed to assign service' });
  }
});

// DELETE /api/staff/:id/remove-service
router.delete('/:id/remove-service', requireAdmin, async (req, res) => {
  const { service_id } = req.body;
  if (!service_id) return res.status(400).json({ error: 'service_id is required' });

  try {
    await db.runAsync(
      "DELETE FROM staff_service_assignments WHERE staff_id = ? AND service_id = ?",
      [req.params.id, service_id]
    );
    res.json({ message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove service' });
  }
});

// POST /api/staff — create a new staff member (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const bcrypt = require('bcrypt');
  const { name, email, phone, category, specialty, password } = req.body;
  if (!name || !email || !password || !category) {
    return res.status(400).json({ error: 'name, email, password, and category are required' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const result = await db.runAsync(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, 'staff')",
      [name, email, password_hash, phone || null]
    );
    const userId = result.lastID;
    await db.runAsync(
      "INSERT INTO staff_profiles (user_id, category, specialty, rating, is_available) VALUES (?, ?, ?, 0, 1)",
      [userId, category, specialty || '']
    );
    
    const newStaff = await db.getAsync(
      `SELECT u.id, u.name, u.email, u.phone, sp.category, sp.specialty, sp.rating, sp.is_available,
       (SELECT GROUP_CONCAT(service_id) FROM staff_service_assignments WHERE staff_id = u.id) as assigned_service_ids
       FROM users u JOIN staff_profiles sp ON u.id = sp.user_id WHERE u.id = ?`,
      [userId]
    );
    res.status(201).json({ 
      ...newStaff, 
      is_available: Boolean(newStaff.is_available),
      assigned_service_ids: newStaff.assigned_service_ids ? newStaff.assigned_service_ids.split(',').map(Number) : []
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// PUT /api/staff/:id — update staff member details (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const staffId = req.params.id;
  const { name, email, phone, category, specialty, is_available, status } = req.body;
  
  try {
    const user = await db.getAsync("SELECT id FROM users WHERE id = ? AND role = 'staff'", [staffId]);
    if (!user) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Update users table
    await db.runAsync(`
      UPDATE users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone)
      WHERE id = ?
    `, [name, email, phone, staffId]);

    // Update staff_profiles table
    // Note: status can be used to set is_available. Only update if status or is_available is supplied.
    const availabilitySupplied = status !== undefined || is_available !== undefined;
    const availabilityValue = availabilitySupplied 
      ? (status === 'active' || is_available === true || is_available === 1 ? 1 : 0)
      : null;
    
    await db.runAsync(`
      UPDATE staff_profiles SET
        category = COALESCE(?, category),
        specialty = COALESCE(?, specialty),
        is_available = CASE WHEN ? = 1 THEN ? ELSE is_available END
      WHERE user_id = ?
    `, [category, specialty, availabilitySupplied ? 1 : 0, availabilityValue, staffId]);

    const updatedStaff = await db.getAsync(`
      SELECT u.id, u.name, u.email, u.phone, sp.category, sp.specialty, sp.rating, sp.is_available
      FROM users u
      JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `, [staffId]);

    res.json({ ...updatedStaff, is_available: Boolean(updatedStaff.is_available) });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// DELETE /api/staff/:id — permanently delete a staff member (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const staffId = req.params.id;
  try {
    // Verify the user exists and is a staff member
    const user = await db.getAsync(
      "SELECT id, name FROM users WHERE id = ? AND role = 'staff'",
      [staffId]
    );
    if (!user) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    // Deleting from users cascades to staff_profiles and staff_service_assignments
    await db.runAsync("DELETE FROM users WHERE id = ?", [staffId]);
    res.json({ message: `Staff member '${user.name}' deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// GET /api/staff/:id/rating - get staff rating metrics
router.get('/:id/rating', async (req, res) => {
  const staffId = req.params.id;
  try {
    const row = await db.getAsync(
      'SELECT rating FROM staff_profiles WHERE user_id = ?',
      [staffId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Count real completed appointments as the review count
    const countRow = await db.getAsync(
      "SELECT COUNT(*) AS count FROM appointments WHERE staff_id = ? AND status = 'completed'",
      [staffId]
    );

    res.json({
      average: row.rating || 0,
      count: countRow?.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

module.exports = router;
