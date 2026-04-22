const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Service, StaffProfile, Appointment } = require('../db');
const { requireAdmin, verifyToken } = require('../middleware/authMiddleware');

// ---------- Multer setup ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const validateImageFile = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, AVIF, and GIF images are allowed.'), false);
};
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: validateImageFile });

// ---------- GET /api/services/categories ----------
router.get('/categories', async (req, res) => {
  try {
    const CATEGORIES = [
      { id: 1, name: 'Hair',     description: 'All hair-related treatments',          icon: 'scissors', color: '#8B5CF6' },
      { id: 2, name: 'Facial',   description: 'Skin care and facial services',         icon: 'star',     color: '#EC4899' },
      { id: 3, name: 'Nails',    description: 'Manicure and pedicure services',        icon: 'palette',  color: '#10B981' },
      { id: 4, name: 'Massage',  description: 'Relaxation and therapeutic massages',   icon: 'activity', color: '#F59E0B' },
      { id: 5, name: 'Wellness', description: 'Holistic wellness treatments',          icon: 'activity', color: '#10B981' },
      { id: 6, name: 'Beauty',   description: 'General beauty services',               icon: 'star',     color: '#EC4899' },
    ];

    const counts = await Service.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    res.json(CATEGORIES.map(c => ({ ...c, service_count: countMap[c.name] || 0 })));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ---------- GET /api/services ----------
router.get('/', async (req, res) => {
  const { category, min_price, max_price, bookable } = req.query;
  const include_inactive = req.query.include_inactive === 'true';
  try {
    const filter = {};
    if (!include_inactive) filter.isActive = true;
    if (category)  filter.category = category;
    if (min_price) filter.price = { ...(filter.price || {}), $gte: parseFloat(min_price) };
    if (max_price) filter.price = { ...(filter.price || {}), $lte: parseFloat(max_price) };

    const services = await Service.find(filter);

    // Count bookings per service
    const bookingCounts = await Appointment.aggregate([
      { $match: { serviceId: { $in: services.map(s => s._id) } } },
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
    ]);
    const bookingMap = {};
    bookingCounts.forEach(b => { bookingMap[b._id.toString()] = b.count; });

    // Get available staff names per category
    const profiles = await StaffProfile.find({ isAvailable: true }).populate('userId', 'name role');
    const staffByCat = {};
    profiles.forEach(p => {
      if (!p.userId || p.userId.role !== 'staff') return;
      const cat = p.category;
      if (!staffByCat[cat]) staffByCat[cat] = [];
      staffByCat[cat].push(p.userId.name);
    });

    const formatted = services
      .filter(s => {
        if (bookable === 'true') return (staffByCat[s.category] || []).length > 0;
        return true;
      })
      .map(s => ({
        id:            s._id.toString(),
        name:          s.name,
        description:   s.description,
        duration:      s.duration,
        price:         s.price,
        category:      s.category,
        is_active:     s.isActive,
        image_url:     s.imageUrl,
        created_at:    s.createdAt,
        booking_count: bookingMap[s._id.toString()] || 0,
        assigned_staff: staffByCat[s.category] || [],
      }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ---------- POST /api/services ----------
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  const { name, description, duration, price, category } = req.body;
  if (!name || !duration || !price || !category)
    return res.status(400).json({ error: 'Name, duration, price, and category are required' });

  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const service  = await Service.create({ name, description, duration: +duration, price: +price, category, imageUrl, isActive: true });
    res.status(201).json({
      id: service._id.toString(), name: service.name, description: service.description,
      duration: service.duration, price: service.price, category: service.category,
      is_active: service.isActive, image_url: service.imageUrl, created_at: service.createdAt,
    });
  } catch (error) {
    console.error('Error in POST /api/services:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ---------- PUT /api/services/:id ----------
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const { price, duration, description, name, category, is_active } = req.body;
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    if (name)        service.name        = name;
    if (description) service.description = description;
    if (duration)    service.duration    = +duration;
    if (price)       service.price       = +price;
    if (category)    service.category    = category;
    if (req.file)    service.imageUrl    = `/uploads/${req.file.filename}`;

    if (is_active !== undefined) {
      service.isActive = (is_active === 'true' || is_active === '1' || is_active === true);
    }

    await service.save();
    res.json({
      id: service._id.toString(), name: service.name, description: service.description,
      duration: service.duration, price: service.price, category: service.category,
      is_active: service.isActive, image_url: service.imageUrl, created_at: service.createdAt,
    });
  } catch (error) {
    console.error('Error in PUT /api/services/:id:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// ---------- GET /api/services/:id/details ----------
router.get('/:id/details', verifyToken, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const profiles = await StaffProfile.find({ category: service.category, isAvailable: true }).populate('userId', 'name role');
    const assignedStaff = profiles
      .filter(p => p.userId?.role === 'staff')
      .map(p => ({ id: p.userId._id.toString(), name: p.userId.name, specialty: p.specialty, rating: p.rating }));

    const bookings = await Appointment.find({ serviceId: service._id })
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(10)
      .populate('customerId', 'name');

    res.json({
      service: {
        id: service._id.toString(), name: service.name, description: service.description,
        duration: service.duration, price: service.price, category: service.category,
        is_active: service.isActive, image_url: service.imageUrl,
      },
      assignedStaff,
      bookings: bookings.map(b => ({
        id: b._id.toString(), customer_name: b.customerId?.name,
        appointment_date: b.appointmentDate, appointment_time: b.appointmentTime, status: b.status,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch service details' });
  }
});

// ---------- DELETE /api/services/:id ----------
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const totalCount  = await Appointment.countDocuments({ serviceId: req.params.id });
    if (totalCount > 0) {
      service.isActive = false;
      await service.save();

      const now = new Date().toISOString().split('T')[0];
      const futureCount = await Appointment.countDocuments({ serviceId: req.params.id, appointmentDate: { $gte: now } });

      if (futureCount > 0) {
        return res.status(200).json({ message: 'Service has future appointments. It has been deactivated and hidden from customers, but preserved for existing bookings.', deactivated: true, deleted: false });
      }
      return res.status(200).json({ message: 'Service has past appointment history. It has been deactivated and hidden from the catalog.', deactivated: true, deleted: false });
    }

    // Remove from staff profiles before deleting
    await StaffProfile.updateMany({ services: service._id }, { $pull: { services: service._id } });
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service permanently deleted successfully', deactivated: false, deleted: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
