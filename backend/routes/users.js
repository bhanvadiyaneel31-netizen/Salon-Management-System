const express = require('express');
const router = express.Router();
const { User, StaffProfile, Appointment } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/users/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalAppointments = await Appointment.countDocuments({ customerId: req.user.user_id });

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
      profile_image: user.profileImage || '',
      loyalty_points: user.loyaltyPoints || 0,
      created_at: user.createdAt,
      total_appointments: totalAppointments,
    });
  } catch (error) {
    console.error('GET /users/me error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/users/update
router.put('/update', verifyToken, async (req, res) => {
  const { id, name, email, phone, address, profile_image, role, specialty, reminders } = req.body;
  const updaterId = req.user.user_id;
  const updaterRole = req.user.role;
  const targetUserId = id || updaterId;

  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if ((updaterRole === 'staff' || updaterRole === 'customer') && targetUserId !== updaterId)
      return res.status(403).json({ error: `${updaterRole.charAt(0).toUpperCase() + updaterRole.slice(1)} can only update their own profile` });

    const userUpdates = {};
    const staffProfileUpdates = {};

    // Reminder preferences (mapped to camelCase fields)
    if (reminders) {
      if (updaterRole === 'admin') return res.status(403).json({ error: 'You are not allowed to edit reminder preferences' });
      if (reminders.email !== undefined) userUpdates.reminderEmail = reminders.email;
      if (reminders.sms !== undefined) userUpdates.reminderSms = reminders.sms;
      if (reminders.timing !== undefined) userUpdates.reminderTiming = reminders.timing;
    }

    if (updaterRole === 'staff' || updaterRole === 'customer') {
      // Forbidden fields
      if (email && email !== targetUser.email) return res.status(403).json({ error: 'You are not allowed to edit the email field' });
      if (role && role !== targetUser.role) return res.status(403).json({ error: 'You are not allowed to edit the role field' });
      if (specialty) return res.status(403).json({ error: 'You are not allowed to edit the specialty field' });

      if (name) userUpdates.name = name;
      if (phone) userUpdates.phone = phone;
      if (address) userUpdates.address = address;
      if (profile_image !== undefined) userUpdates.profileImage = profile_image; // allow '' to clear
    } else if (updaterRole === 'admin') {
      // Forbidden fields for admin
      if (name && name !== targetUser.name) return res.status(403).json({ error: 'You are not allowed to edit the name field' });
      if (phone && phone !== targetUser.phone) return res.status(403).json({ error: 'You are not allowed to edit the phone field' });
      if (address && address !== targetUser.address) return res.status(403).json({ error: 'You are not allowed to edit the address field' });
      if (profile_image && profile_image !== targetUser.profileImage) return res.status(403).json({ error: 'You are not allowed to edit the profile image' });

      if (email) userUpdates.email = email;
      if (role) userUpdates.role = role;
      if (specialty) staffProfileUpdates.specialty = specialty;
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(targetUserId, userUpdates);
    }

    if (Object.keys(staffProfileUpdates).length > 0) {
      await StaffProfile.findOneAndUpdate({ userId: targetUserId }, staffProfileUpdates, { upsert: true });
    }

    const updatedUser = await User.findById(targetUserId);
    const profile = await StaffProfile.findOne({ userId: targetUserId });
    const reviewCount = await Appointment.countDocuments({ staffId: targetUserId, status: 'completed' });

    res.status(200).json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      role: updatedUser.role,
      address: updatedUser.address || '',
      profile_image: updatedUser.profileImage || '',
      specialty: profile?.specialty || '',
      review_count: reviewCount,
      created_at: updatedUser.createdAt,
    });
  } catch (error) {
    console.error('User update error:', error);
    if (error.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

module.exports = router;