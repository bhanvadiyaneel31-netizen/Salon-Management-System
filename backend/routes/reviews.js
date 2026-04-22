const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Review } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// ---------- GET /api/reviews/staff ----------
// Get reviews for the currently logged-in staff member or all reviews if admin
router.get('/staff', verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'staff') {
      query.staffId = new mongoose.Types.ObjectId(req.user.user_id);
    } else if (req.user.role === 'admin') {
      // Admin sees all, or can filter by staff_id query param
      if (req.query.staff_id) {
        if (!mongoose.Types.ObjectId.isValid(req.query.staff_id)) return res.status(400).json({ error: 'Invalid staff ID' });
        query.staffId = new mongoose.Types.ObjectId(req.query.staff_id);
      }
    } else if (req.user.role === 'customer') {
       // Customer sees only reviews they wrote
       query.userId = new mongoose.Types.ObjectId(req.user.user_id);
    } else {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name')
      .populate('staffId', 'name')
      .populate('serviceId', 'name');

    const formatted = reviews.map(r => ({
      id: r._id.toString(),
      customer_name: r.userId?.name || 'Unknown Customer',
      staff_name: r.staffId?.name || 'Unknown Staff',
      service_name: r.serviceId?.name || 'Service',
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[REVIEWS] Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
