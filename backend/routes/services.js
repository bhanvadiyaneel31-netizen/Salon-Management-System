const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/services
router.get('/', async (req, res) => {
  const { category, min_price, max_price } = req.query;
  try {
    let query = "SELECT * FROM services WHERE is_active = 1";
    const params = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (min_price) {
      query += " AND price >= ?";
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      query += " AND price <= ?";
      params.push(parseFloat(max_price));
    }

    const services = await db.allAsync(query, params);
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, duration, price, category } = req.body;
  if (!name || !duration || !price || !category) {
    return res.status(400).json({ error: 'Name, duration, price, and category are required' });
  }

  try {
    const result = await db.runAsync(
      "INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)",
      [name, description, duration, price, category]
    );
    const newService = await db.getAsync("SELECT * FROM services WHERE id = ?", [result.lastID]);
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/services/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { price, duration, description, name, category, is_active } = req.body;
  
  try {
    const service = await db.getAsync("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await db.runAsync(
      `UPDATE services SET 
         price = COALESCE(?, price), 
         duration = COALESCE(?, duration), 
         description = COALESCE(?, description),
         name = COALESCE(?, name),
         category = COALESCE(?, category),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [price, duration, description, name, category, is_active, req.params.id]
    );

    const updated = await db.getAsync("SELECT * FROM services WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const service = await db.getAsync("SELECT * FROM services WHERE id = ?", [req.params.id]);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const futureAppointments = await db.getAsync(
      "SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND appointment_date >= DATE('now')",
      [req.params.id]
    );

    if (futureAppointments.count > 0) {
      // Soft destroy logic is required if future appointments exist
      await db.runAsync("UPDATE services SET is_active = 0 WHERE id = ?", [req.params.id]);
      return res.status(409).json({ error: 'Cannot arbitrarily destroy service with future appointments. Deactivated instead.' });
    }

    await db.runAsync("UPDATE services SET is_active = 0 WHERE id = ?", [req.params.id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
