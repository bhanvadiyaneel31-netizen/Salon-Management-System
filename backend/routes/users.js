const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/users/me
// Returns full profile of the authenticated user from the live database
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.getAsync(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.address, u.role,
        u.loyalty_points, u.created_at,
        (SELECT COUNT(*) FROM appointments a WHERE a.customer_id = u.id) AS total_appointments
      FROM users u
      WHERE u.id = ?
    `, [req.user.user_id]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('GET /users/me error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/users/update

// Unified endpoint for updating user profiles with role-based field restrictions
router.put('/update', verifyToken, async (req, res) => {
  const { 
    id, name, email, phone, address, profile_image, role, specialty,
    reminders 
  } = req.body;
  const updaterId = req.user.user_id;
  const updaterRole = req.user.role;
  const targetUserId = id || updaterId;

  try {
    // 1. Fetch current target user data
    const targetUser = await db.getAsync("SELECT * FROM users WHERE id = ?", [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Authorization check
    if (updaterRole === 'staff' && targetUserId !== updaterId) {
      return res.status(403).json({ error: 'Staff can only update their own profile' });
    }

    // 3. Field-level permission enforcement
    let updates = {};
    let staffProfileUpdates = {};

    // Helper to handle reminders mapping
    if (reminders) {
      if (reminders.email !== undefined) updates.reminder_email = reminders.email ? 1 : 0;
      if (reminders.sms !== undefined) updates.reminder_sms = reminders.sms ? 1 : 0;
      if (reminders.timing !== undefined) updates.reminder_timing = reminders.timing;
    }

    if (updaterRole === 'staff') {
      // Staff Permissions:
      // Allowed: Name, Phone, Address, Profile image, Reminders
      // Forbidden: Email, Role
      if (email && email !== targetUser.email) return res.status(403).json({ error: 'You are not allowed to edit the email field' });
      if (role && role !== targetUser.role) return res.status(403).json({ error: 'You are not allowed to edit the role field' });
      if (specialty) return res.status(403).json({ error: 'You are not allowed to edit the specialty field' });

      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;
      if (profile_image) updates.profile_image = profile_image;
    } 
    else if (updaterRole === 'admin') {
      // Admin Permissions (Restricted):
      // Allowed: Email, Role, Specialty
      // Forbidden: Name, Phone, Address, Profile image, Reminders
      if (name && name !== targetUser.name) return res.status(403).json({ error: 'You are not allowed to edit the name field' });
      if (phone && phone !== targetUser.phone) return res.status(403).json({ error: 'You are not allowed to edit the phone field' });
      if (address && address !== targetUser.address) return res.status(403).json({ error: 'You are not allowed to edit the address field' });
      if (profile_image && profile_image !== targetUser.profile_image) return res.status(403).json({ error: 'You are not allowed to edit the profile image' });
      if (reminders) return res.status(403).json({ error: 'You are not allowed to edit reminder preferences' });

      if (email) updates.email = email;
      if (role) updates.role = role;
      if (specialty) staffProfileUpdates.specialty = specialty;
    }
    else {
      // Customer or other roles: Same as staff
      if (email && email !== targetUser.email) return res.status(403).json({ error: 'Email update is restricted' });
      if (role && role !== targetUser.role) return res.status(403).json({ error: 'Role update is restricted' });
      
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;
      if (profile_image) updates.profile_image = profile_image;
    }

    // 4. Perform database updates
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const params = [...Object.values(updates), targetUserId];
      await db.runAsync(`UPDATE users SET ${setClause} WHERE id = ?`, params);
    }

    if (Object.keys(staffProfileUpdates).length > 0) {
      // Ensure staff profile exists
      await db.runAsync("INSERT OR IGNORE INTO staff_profiles (user_id) VALUES (?)", [targetUserId]);
      const setClause = Object.keys(staffProfileUpdates).map(k => `${k} = ?`).join(', ');
      const params = [...Object.values(staffProfileUpdates), targetUserId];
      await db.runAsync(`UPDATE staff_profiles SET ${setClause} WHERE user_id = ?`, params);
    }

    // 5. Fetch and return updated user
    const updatedUser = await db.getAsync(`
      SELECT u.*, sp.specialty, sp.rating, 
             (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = u.id AND a.status = 'completed') as review_count
      FROM users u 
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id 
      WHERE u.id = ?
    `, [targetUserId]);

    // Format response (reusing logic from auth.js if needed, or simple version here)
    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      address: updatedUser.address || '',
      profile_image: updatedUser.profile_image || '',
      specialty: updatedUser.specialty || '',
      created_at: updatedUser.created_at
    });

  } catch (error) {
    console.error('User update error:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

module.exports = router;
