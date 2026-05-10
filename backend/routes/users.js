const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User, StaffProfile, Appointment } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');

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

// PATCH /api/users/me  — customer self-update (used by ProfileSettingsPanel)
router.patch('/me', verifyToken, async (req, res) => {
  // Staff must use PATCH /api/staff/profile instead
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin accounts cannot be edited via this endpoint' });
  }

  const userId = req.user.user_id;
  const { name, email, phone, address, profile_image, password, currentPassword } = req.body;

  if (profile_image !== undefined) {
    return res.status(403).json({ error: 'Use POST /api/users/upload-avatar for images' });
  }

  try {
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim() || null;
    if (address !== undefined) updates.address = address.trim() || null;

    if (email !== undefined) {
      const trimmed = email.trim();
      const existing = await User.findOne({ email: trimmed, _id: { $ne: userId } });
      if (existing) return res.status(409).json({ error: 'Email is already in use by another account' });
      updates.email = trimmed;
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const rawUser = await User.findById(userId).select('+passwordHash').lean();
      if (!rawUser) return res.status(404).json({ error: 'User not found' });
      const isMatch = await bcrypt.compare(currentPassword, rawUser.passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Incorrect current password' });

      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(userId, updates);
    }

    const updatedUser = await User.findById(userId);
    res.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      address: updatedUser.address || '',
      role: updatedUser.role,
      profile_image: updatedUser.profileImage || '',
    });
  } catch (error) {
    console.error('[PATCH /users/me error]', error.message);
    if (error.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Configure multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_TYPE'), false);
    }
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many upload attempts' }
});

// POST /api/users/upload-avatar
router.post('/upload-avatar', verifyToken, uploadLimiter, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File exceeds 5MB limit' });
      return res.status(400).json({ error: err.message });
    } else if (err) {
      if (err.message === 'INVALID_TYPE') return res.status(400).json({ error: 'Only JPEG, PNG, WebP allowed' });
      return res.status(500).json({ error: 'Upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // Validate dimensions with sharp and implicitly check magic bytes
    let metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch (sharpError) {
      return res.status(400).json({ error: 'Invalid image file' });
    }

    if (!metadata.width || !metadata.height) {
      return res.status(400).json({ error: 'Invalid image file' });
    }

    if (metadata.width < 100 || metadata.height < 100 || metadata.width > 2000 || metadata.height > 2000) {
      return res.status(400).json({ error: 'Image must be 100x100 to 2000x2000' });
    }

    // Convert to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update DB
    await User.findByIdAndUpdate(req.user.user_id, { profileImage: base64Image });

    console.log(`[AUDIT] User ${req.user.user_id} uploaded a new profile image (${metadata.format}, ${req.file.size} bytes)`);

    res.json({
      success: true,
      profile_image: base64Image,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// PUT /api/users/update
router.put('/update', verifyToken, async (req, res) => {
  const { id, name, email, phone, address, profile_image, role, specialty, reminders } = req.body;
  const updaterId = req.user.user_id;
  const updaterRole = req.user.role;
  const targetUserId = id || updaterId;

  // ✅ validate targetUserId is a real ObjectId before hitting DB
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if ((updaterRole === 'staff' || updaterRole === 'customer') && targetUserId !== updaterId)
      return res.status(403).json({ error: `${updaterRole.charAt(0).toUpperCase() + updaterRole.slice(1)} can only update their own profile` });

    const userUpdates = {};
    const staffProfileUpdates = {};

    if (reminders) {
      if (updaterRole === 'admin') return res.status(403).json({ error: 'You are not allowed to edit reminder preferences' });
      if (reminders.email !== undefined) userUpdates.reminderEmail = reminders.email;
      if (reminders.sms !== undefined) userUpdates.reminderSms = reminders.sms;
      if (reminders.timing !== undefined) userUpdates.reminderTiming = reminders.timing;
    }

    if (updaterRole === 'staff' || updaterRole === 'customer') {
      if (email && email !== targetUser.email) return res.status(403).json({ error: 'You are not allowed to edit the email field' });
      if (role && role !== targetUser.role) return res.status(403).json({ error: 'You are not allowed to edit the role field' });
      if (specialty) return res.status(403).json({ error: 'You are not allowed to edit the specialty field' });

      if (name) userUpdates.name = name;
      if (phone) userUpdates.phone = phone;
      if (address) userUpdates.address = address;
      if (profile_image !== undefined) userUpdates.profileImage = profile_image;

    } else if (updaterRole === 'admin') {
      if (name && name !== targetUser.name) return res.status(403).json({ error: 'You are not allowed to edit the name field' });
      if (phone && phone !== targetUser.phone) return res.status(403).json({ error: 'You are not allowed to edit the phone field' });
      if (address && address !== targetUser.address) return res.status(403).json({ error: 'You are not allowed to edit the address field' });
      if (profile_image && profile_image !== targetUser.profileImage) return res.status(403).json({ error: 'You are not allowed to edit the profile image' });

      if (email) userUpdates.email = email;

      // ✅ FIX SEV-006: strict role allowlist — admin cannot promote anyone to admin
      if (role) {
        const ALLOWED_ROLES = ['customer', 'staff'];
        if (!ALLOWED_ROLES.includes(role)) {
          return res.status(400).json({ error: `Invalid role. Allowed values: ${ALLOWED_ROLES.join(', ')}` });
        }
        userUpdates.role = role;
        // ✅ audit log every role change
        console.log(`[AUDIT] Role change: user ${targetUserId} → '${role}' by admin ${updaterId} at ${new Date().toISOString()}`);
      }

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