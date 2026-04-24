const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User, StaffProfile, Appointment, Service } = require('../db');
const { requireAdmin, verifyToken } = require('../middleware/authMiddleware');

// ---------- GET /api/staff ----------
router.get('/', async (req, res) => {
  try {
    const staffUsers = await User.find({ role: 'staff' });
    const profiles = await StaffProfile.find({ userId: { $in: staffUsers.map(u => u._id) } });

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

    const completedCounts = await Appointment.aggregate([
      { $match: { staffId: { $in: staffUsers.map(u => u._id) }, status: 'completed' } },
      { $group: { _id: '$staffId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    completedCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const formatted = staffUsers.map(u => {
      const p = profileMap[u._id.toString()];
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        category: p?.category || '',
        specialty: p?.specialty || '',
        rating: p?.rating || 0,
        is_available: p?.isAvailable ?? true,
        created_at: p?.createdAt || u.createdAt,
        completed_appointments: countMap[u._id.toString()] || 0,
        services: (p?.services || []).map(id => id.toString()),
        assigned_service_ids: (p?.services || []).map(id => id.toString()),
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('[STAFF] Failed to fetch staff:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// ---------- GET /api/staff/available ----------
router.get('/available', async (req, res) => {
  const { service_id } = req.query;
  console.log(`[STAFF] Fetching available staff for service_id: ${service_id}`);

  try {
    const profileQuery = { isAvailable: true };

    if (service_id) {
      if (!mongoose.Types.ObjectId.isValid(service_id)) {
        console.warn(`[STAFF] Invalid service_id provided: ${service_id}`);
        return res.status(400).json({ error: 'Invalid service_id format' });
      }
      // Query staff who have this specific service in their services array
      profileQuery.services = new mongoose.Types.ObjectId(service_id);
    }

    console.log(`[STAFF] Querying StaffProfile with:`, profileQuery);
    const profiles = await StaffProfile.find(profileQuery).sort({ rating: -1 });
    console.log(`[STAFF] Found ${profiles.length} profiles`);

    if (profiles.length === 0) {
      return res.json([]);
    }

    const staffUserIds = profiles.map(p => p.userId);
    const staffUsers = await User.find({ _id: { $in: staffUserIds }, role: 'staff' });
    const userMap = {};
    staffUsers.forEach(u => { userMap[u._id.toString()] = u; });

    const formatted = profiles.map(p => {
      const u = userMap[p.userId.toString()];
      if (!u) return null;
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        category: p.category || '',
        specialty: p.specialty || '',
        rating: p.rating || 0,
        is_available: p.isAvailable,
        services: p.services.map(id => id.toString()),
      };
    }).filter(Boolean);

    console.log(`[STAFF] Returning ${formatted.length} formatted staff members`);
    res.json(formatted);
  } catch (error) {
    console.error('[STAFF] Failed to fetch available staff:', error.message);
    res.status(500).json({ error: 'Failed to fetch available staff' });
  }
});

// ---------- GET /api/staff/:id ----------
router.get('/:id', async (req, res) => {
  const staffId = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(staffId)) return res.status(400).json({ error: 'Invalid staff ID' });

    const user = await User.findOne({ _id: staffId, role: 'staff' });
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    const profile = await StaffProfile.findOne({ userId: staffId }).populate('services');
    const appointmentCount = await Appointment.countDocuments({ staffId, status: 'completed' });

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      category: profile?.category || '',
      specialty: profile?.specialty || '',
      rating: profile?.rating || 0,
      is_available: profile?.isAvailable ?? true,
      services: (profile?.services || []).map(s => ({ id: s._id.toString(), name: s.name })),
      assigned_service_ids: (profile?.services || []).map(s => s._id.toString()),
      completed_appointments: appointmentCount,
      created_at: user.createdAt,
    });
  } catch (error) {
    console.error('[STAFF] Failed to fetch staff detail:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff details' });
  }
});

// ---------- GET /api/staff/:id/services ----------
router.get('/:id/services', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid staff ID' });
    const staffUser = await User.findOne({ _id: req.params.id, role: 'staff' });
    if (!staffUser) return res.status(404).json({ error: 'Staff not found' });

    const profile = await StaffProfile.findOne({ userId: req.params.id }).populate('services', 'id name category');
    const services = profile ? profile.services : [];

    res.json({
      staff: { id: staffUser._id.toString(), name: staffUser.name, category: profile?.category || '', specialty: profile?.specialty || '' },
      services: services.map(s => ({ id: s._id.toString(), name: s.name, category: s.category })),
    });
  } catch (error) {
    console.error('[STAFF] Failed to fetch staff services:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff services' });
  }
});

// ---------- PATCH /api/staff/profile (staff updates own profile) ----------
router.patch('/profile', verifyToken, async (req, res) => {
  if (req.user.role !== 'staff') return res.status(403).json({ error: 'Only staff members can update their profile here' });

  const staffId = req.user.user_id;

  // Rule: Staff cannot update role or primary category
  const restrictedFields = ['role', 'category'];
  for (const field of restrictedFields) {
    if (req.body[field] !== undefined) {
      return res.status(403).json({ error: `Staff are not allowed to update their own ${field === 'category' ? 'primary category' : field}` });
    }
  }

  const { name, email, phone, password, currentPassword, address, profile_image } = req.body;

  try {
    const updates = {};

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim() || null;
    if (address !== undefined) updates.address = address.trim() || null;
    if (profile_image !== undefined) updates.profileImage = profile_image || null;

    if (email) {
      const existing = await User.findOne({ email: email.trim(), _id: { $ne: staffId } });
      if (existing) return res.status(409).json({ error: 'Email is already in use by another account' });
      updates.email = email.trim();
    }

    if (password) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to set a new password' });
      const user = await User.findById(staffId).select('+passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });

      const rawUser = await User.findById(staffId).lean().select('+passwordHash');
      const isMatch = await bcrypt.compare(currentPassword, rawUser.passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Incorrect current password' });

      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(staffId, updates);
    }

    const updatedUser = await User.findById(staffId);
    const profile = await StaffProfile.findOne({ userId: staffId });

    res.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      address: updatedUser.address || '',
      profile_image: updatedUser.profileImage || '',
      category: profile?.category || '',
      specialty: profile?.specialty || '',
      is_available: profile?.isAvailable ?? true,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ---------- POST /api/staff (admin creates staff) ----------
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, category, password } = req.body;
  if (!name || !email || !password || !category)
    return res.status(400).json({ error: 'name, email, password, and category are required' });

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({ name, email, passwordHash, role: 'staff' });
    const profile = await StaffProfile.create({ userId: newUser._id, category, specialty: '', rating: 0, isAvailable: true });

    res.status(201).json({
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '',
      category: profile.category,
      specialty: profile.specialty,
      rating: profile.rating,
      is_available: profile.isAvailable,
    });
  } catch (error) {
    console.error('[STAFF CREATE ERROR]', { email, error: error.message, stack: error.stack });
    if (error.code === 11000) return res.status(409).json({ error: 'A user with this email already exists' });
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// ---------- PATCH /api/staff/:id (admin updates staff category/status/role) ----------
router.patch('/:id', requireAdmin, async (req, res) => {
  const staffId = req.params.id;

  // Rule: Admins cannot update personal details
  const restrictedFields = ['name', 'email', 'phone', 'password', 'address', 'profile_image'];
  for (const field of restrictedFields) {
    if (req.body[field] !== undefined)
      return res.status(403).json({ error: `Admins are not allowed to update staff ${field.replace('_', ' ')}` });
  }

  const { category, role, status, is_available } = req.body;

  try {
    const user = await User.findOne({ _id: staffId, role: 'staff' });
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    // Handle User model updates (e.g., role)
    if (role) {
      const SUPPORTED_ROLES = ['customer', 'staff', 'admin'];
      if (!SUPPORTED_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      await User.findByIdAndUpdate(staffId, { role });
    }

    // Handle StaffProfile model updates
    const profileUpdates = {};
    if (category) profileUpdates.category = category;
    if (status !== undefined || is_available !== undefined) {
      profileUpdates.isAvailable = (status === 'active' || is_available === true || is_available === 1);
    }

    if (Object.keys(profileUpdates).length > 0) {
      await StaffProfile.findOneAndUpdate({ userId: staffId }, profileUpdates);
    }

    const profile = await StaffProfile.findOne({ userId: staffId });
    const freshUser = await User.findById(staffId);

    res.json({
      id: freshUser._id.toString(),
      name: freshUser.name,
      email: freshUser.email,
      phone: freshUser.phone || '',
      category: profile?.category || '',
      specialty: profile?.specialty || '',
      rating: profile?.rating || 0,
      is_available: profile?.isAvailable ?? true,
    });
  } catch (error) {
    console.error('[STAFF UPDATE ERROR]', { id: staffId, error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// ---------- DELETE /api/staff/:id ----------
router.delete('/:id', requireAdmin, async (req, res) => {
  const staffId = req.params.id;
  try {
    const user = await User.findOne({ _id: staffId, role: 'staff' });
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    await StaffProfile.findOneAndDelete({ userId: staffId });
    await User.findByIdAndDelete(staffId);

    res.json({ message: `Staff member '${user.name}' deleted successfully` });
  } catch (error) {
    console.error('[STAFF DELETE ERROR]', { id: staffId, error: error.message });
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// ---------- PATCH /api/staff/:id/services (admin assigns services to staff) ----------
router.patch('/:id/services', requireAdmin, async (req, res) => {
  const staffId = req.params.id;
  const { service_ids } = req.body;

  if (!Array.isArray(service_ids)) {
    return res.status(400).json({ error: 'service_ids must be an array' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: 'Invalid staff ID' });
    }

    const user = await User.findOne({ _id: staffId, role: 'staff' });
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    // Validate all service_ids are valid ObjectIds and exist
    const validIds = service_ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));

    // Verify services exist
    const foundServices = await Service.find({ _id: { $in: objectIds } });
    if (foundServices.length !== objectIds.length) {
      return res.status(400).json({ error: 'One or more service IDs are invalid or do not exist' });
    }

    // Update the StaffProfile services array
    const updatedProfile = await StaffProfile.findOneAndUpdate(
      { userId: staffId },
      { $set: { services: objectIds } },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    console.log(`[STAFF] Updated services for staff ${staffId}:`, objectIds);

    res.json({
      id: user._id.toString(),
      name: user.name,
      assigned_service_ids: updatedProfile.services.map(id => id.toString()),
    });
  } catch (error) {
    console.error('[STAFF] Failed to update staff services:', error.message);
    res.status(500).json({ error: 'Failed to update staff services' });
  }
});

// ---------- GET /api/staff/:id/rating ----------
router.get('/:id/rating', async (req, res) => {
  const staffId = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(staffId)) return res.status(400).json({ error: 'Invalid staff ID' });
    const profile = await StaffProfile.findOne({ userId: new mongoose.Types.ObjectId(staffId) });
    if (!profile) return res.status(404).json({ error: 'Staff member not found' });

    const count = await Appointment.countDocuments({ staffId: new mongoose.Types.ObjectId(staffId), status: 'completed' });
    res.json({ average: profile.rating || 0, count });
  } catch (error) {
    console.error('[STAFF RATING ERROR]', { id: staffId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

module.exports = router;