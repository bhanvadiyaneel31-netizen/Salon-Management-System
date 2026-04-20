const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin, verifyToken } = require('../middleware/authMiddleware');

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

// PATCH /api/staff/profile — staff updates their own personal details
router.patch('/profile', verifyToken, async (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Only staff members can update their profile here' });
  }

  const { name, email, phone, password, category, address, profile_image } = req.body;
  const staffId = req.user.user_id;

  console.log(`PATCH /api/staff/profile - User: ${staffId}, Request:`, req.body);

  // Block category update by staff — controlled by admin only
  if (category !== undefined) {
    return res.status(403).json({ error: 'Primary category can only be updated by an admin' });
  }

  try {
    const bcrypt = require('bcrypt');
    let updates = [];
    let params = [];

    if (name) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (email) {
      // Ensure email is not already taken by another user
      const existing = await db.getAsync("SELECT id FROM users WHERE email = ? AND id != ?", [email.trim(), staffId]);
      if (existing) {
        return res.status(409).json({ error: 'Email is already in use by another account' });
      }
      updates.push("email = ?");
      params.push(email.trim());
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone.trim() || null);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updates.push("password_hash = ?");
      params.push(password_hash);
    }

    if (address !== undefined) {
      updates.push("address = ?");
      params.push(address.trim() || null);
    }
    if (profile_image !== undefined) {
      updates.push("profile_image = ?");
      params.push(profile_image || null);
    }

    if (updates.length > 0) {
      params.push(staffId);
      await db.runAsync(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const updatedProfile = await db.getAsync(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.profile_image, sp.category, sp.specialty, sp.is_available
      FROM users u
      JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `, [staffId]);

    console.log(`Profile update successful for staff ${staffId}. Updates:`, updates);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/staff — create a new staff member (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const bcrypt = require('bcrypt');
  const { name, email, category, password } = req.body;
  if (!name || !email || !password || !category) {
    return res.status(400).json({ error: 'name, email, password, and category are required' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const result = await db.runAsync(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'staff')",
      [name, email, password_hash]
    );
    const userId = result.lastID;
    await db.runAsync(
      "INSERT INTO staff_profiles (user_id, category, specialty, rating, is_available) VALUES (?, ?, '', 0, 1)",
      [userId, category]
    );
    
    const newStaff = await db.getAsync(
      `SELECT u.id, u.name, u.email, u.phone, sp.category, sp.specialty, sp.rating, sp.is_available
       FROM users u JOIN staff_profiles sp ON u.id = sp.user_id WHERE u.id = ?`,
      [userId]
    );
    res.status(201).json({ 
      ...newStaff, 
      is_available: Boolean(newStaff.is_available)
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// PATCH /api/staff/:id — admin updates staff category or status
router.patch('/:id', requireAdmin, async (req, res) => {
  const staffId = req.params.id;
  const { category, status, is_available } = req.body;
  
  console.log(`PATCH /api/staff/${staffId} - Admin update:`, req.body);
  
  // RBAC: Admin can ONLY update category and status/is_available
  const restrictedFields = ['name', 'email', 'phone', 'password'];
  for (const field of restrictedFields) {
    if (req.body[field] !== undefined) {
      return res.status(403).json({ error: `Admins are not allowed to update staff ${field}` });
    }
  }

  try {
    const user = await db.getAsync("SELECT id FROM users WHERE id = ? AND role = 'staff'", [staffId]);
    if (!user) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    let profileUpdates = [];
    let params = [];

    if (category) {
      profileUpdates.push("category = ?");
      params.push(category);
    }

    if (status !== undefined || is_available !== undefined) {
      const availabilityValue = (status === 'active' || is_available === true || is_available === 1) ? 1 : 0;
      profileUpdates.push("is_available = ?");
      params.push(availabilityValue);
    }

    if (profileUpdates.length > 0) {
      params.push(staffId);
      await db.runAsync(`UPDATE staff_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`, params);
    }

    const updatedStaff = await db.getAsync(`
      SELECT u.id, u.name, u.email, u.phone, sp.category, sp.specialty, sp.rating, sp.is_available
      FROM users u
      JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.id = ?
    `, [staffId]);

    console.log(`Staff ${staffId} updated by admin. Result:`, updatedStaff);
    res.json({ ...updatedStaff, is_available: Boolean(updatedStaff.is_available) });
  } catch (error) {
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
