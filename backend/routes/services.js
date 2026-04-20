const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { db } = require('../db');
const { requireAdmin, verifyToken } = require('../middleware/authMiddleware');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const validateImageFile = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WEBP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: validateImageFile
});

// GET /api/services/categories
router.get('/categories', async (req, res) => {
  try {
    // Standard categories defined in the system
    const categories = [
      { id: 1, name: 'Hair', description: 'All hair-related treatments', icon: 'scissors', color: '#8B5CF6' },
      { id: 2, name: 'Facial', description: 'Skin care and facial services', icon: 'star', color: '#EC4899' },
      { id: 3, name: 'Nails', description: 'Manicure and pedicure services', icon: 'palette', color: '#10B981' },
      { id: 4, name: 'Massage', description: 'Relaxation and therapeutic massages', icon: 'activity', color: '#F59E0B' },
      { id: 5, name: 'Wellness', description: 'Holistic wellness treatments', icon: 'activity', color: '#10B981' },
      { id: 6, name: 'Beauty', description: 'General beauty services', icon: 'star', color: '#EC4899' }
    ];

    // Fetch real service counts per category
    const counts = await db.allAsync("SELECT category, COUNT(*) as count FROM services GROUP BY category");
    
    const formatted = categories.map(c => ({
      ...c,
      service_count: counts.find(row => row.category === c.name)?.count || 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/services
router.get('/', async (req, res) => {
    const { category, min_price, max_price, bookable } = req.query;
    try {
      const include_inactive = req.query.include_inactive === 'true';
      
      let query = `
        SELECT s.*, 
               (SELECT COUNT(*) FROM appointments WHERE service_id = s.id) as booking_count,
               (SELECT GROUP_CONCAT(name, '|||') FROM (
                  SELECT DISTINCT u.name
                  FROM users u 
                  JOIN staff_profiles sp ON u.id = sp.user_id
                  WHERE u.role = 'staff' AND sp.is_available = 1 AND sp.category = s.category
                )
               ) as assigned_staff 
        FROM services s 
        WHERE 1=1
      `;
      const params = [];

      if (!include_inactive) {
        query += " AND s.is_active = 1";
      }

      if (category) {
        query += " AND s.category = ?";
        params.push(category);
      }
      if (min_price) {
        query += " AND s.price >= ?";
        params.push(parseFloat(min_price));
      }
      if (max_price) {
        query += " AND s.price <= ?";
        params.push(parseFloat(max_price));
      }
      if (bookable === 'true') {
        query += ` AND EXISTS (
          SELECT 1 FROM users u
          JOIN staff_profiles sp ON u.id = sp.user_id
          WHERE u.role = 'staff' AND sp.is_available = 1 AND sp.category = s.category
        )`;
      }

    const services = await db.allAsync(query, params);
    
    // Parse the concatenated string into an array using a custom delimiter '|||', or empty array if null
    const formatted = services.map(s => ({
      ...s,
      assigned_staff: s.assigned_staff ? s.assigned_staff.split('|||') : []
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  console.log('POST /api/services - Request received');
  console.log('Body:', req.body);
  console.log('File:', req.file);

  const { name, description, duration, price, category } = req.body;
  
  if (!name || !duration || !price || !category) {
    console.warn('Validation failed: Missing required fields');
    return res.status(400).json({ error: 'Name, duration, price, and category are required' });
  }

  try {
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    console.log(`Inserting service: ${name}, Price: ${price}, Image: ${image_url}`);

    const result = await db.runAsync(
      "INSERT INTO services (name, description, duration, price, category, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [name, description, duration, price, category, image_url]
    );
    
    console.log(`Service created successfully with ID: ${result.lastID}`);
    
    const newService = await db.getAsync("SELECT * FROM services WHERE id = ?", [result.lastID]);
    console.log(`Service created successfully with ID: ${result.lastID}. Result:`, newService);
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error in POST /api/services:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/services/:id
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  console.log(`PUT /api/services/${req.params.id} - Request received`);
  console.log('Body:', req.body);
  console.log('File:', req.file);

  const { price, duration, description, name, category, is_active } = req.body;
  
  try {
    const service = await db.getAsync("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!service) {
      console.warn(`Service with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Service not found' });
    }

    let image_url = req.file ? `/uploads/${req.file.filename}` : service.image_url;
    
    // Parse is_active if it comes as a string from FormData or boolean from JSON
    let active_val = is_active;
    if (is_active === 'true' || is_active === '1' || is_active === true) active_val = 1;
    if (is_active === 'false' || is_active === '0' || is_active === false) active_val = 0;

    console.log(`Updating service ID ${req.params.id}: Name=${name}, Active=${active_val}, Image=${image_url}`);

    await db.runAsync(
      `UPDATE services SET 
         price = COALESCE(?, price), 
         duration = COALESCE(?, duration), 
         description = COALESCE(?, description),
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         is_active = COALESCE(?, is_active),
         image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [price, duration, description, name, category, active_val, image_url, req.params.id]
    );

    console.log(`Service ID ${req.params.id} updated successfully`);

    const updated = await db.getAsync("SELECT * FROM services WHERE id = ?", [req.params.id]);
    console.log(`Service ID ${req.params.id} updated successfully. Result:`, updated);
    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/services/:id:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// GET /api/services/:id/details
router.get('/:id/details', verifyToken, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await db.getAsync("SELECT * FROM services WHERE id = ?", [serviceId]);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const assignedStaff = await db.allAsync(`
      SELECT DISTINCT u.id, u.name, sp.specialty, sp.rating
      FROM users u
      JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'staff' AND sp.category = (SELECT category FROM services WHERE id = ?)
    `, [serviceId]);

    const bookings = await db.allAsync(`
      SELECT a.*, u.name as customer_name
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      WHERE a.service_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 10
    `, [serviceId]);

    res.json({
      service,
      assignedStaff,
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch service details' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await db.getAsync("SELECT * FROM services WHERE id = ?", [serviceId]);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check for ANY appointments (past or future) due to foreign key RESTRICT constraint
    const allAppointments = await db.getAsync(
      "SELECT COUNT(*) as count FROM appointments WHERE service_id = ?",
      [serviceId]
    );

    if (allAppointments.count > 0) {
      // If there are appointments, we can't hard delete due to FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
      // So we deactivate it instead.
      await db.runAsync("UPDATE services SET is_active = 0 WHERE id = ?", [serviceId]);
      
      const futureAppointments = await db.getAsync(
        "SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND appointment_date >= DATE('now')",
        [serviceId]
      );

      if (futureAppointments.count > 0) {
        return res.status(200).json({ 
          message: 'Service has future appointments. It has been deactivated and hidden from customers, but preserved for existing bookings.',
          deactivated: true,
          deleted: false
        });
      }

      return res.status(200).json({ 
        message: 'Service has past appointment history. It has been deactivated and hidden from the catalog.',
        deactivated: true,
        deleted: false
      });
    }

    // No appointments exist, we can safely hard delete
    // First, clean up staff assignments (though schema has ON DELETE CASCADE, it's good to be explicit or trust schema)
    await db.runAsync("DELETE FROM staff_service_assignments WHERE service_id = ?", [serviceId]);
    await db.runAsync("DELETE FROM services WHERE id = ?", [serviceId]);
    
    res.json({ 
      message: 'Service permanently deleted successfully',
      deactivated: false,
      deleted: true
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
