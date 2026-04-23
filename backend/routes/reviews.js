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
      if (!mongoose.Types.ObjectId.isValid(req.user.user_id)) return res.status(403).json({ error: 'Invalid user session' });
      query.staffId = new mongoose.Types.ObjectId(req.user.user_id);
    } else if (req.user.role === 'admin') {
      // Admin sees all, or can filter by staff_id query param
      if (req.query.staff_id) {
        if (!mongoose.Types.ObjectId.isValid(req.query.staff_id)) return res.status(400).json({ error: 'Invalid staff ID' });
        query.staffId = new mongoose.Types.ObjectId(req.query.staff_id);
      }
    } else if (req.user.role === 'customer') {
      // Customer sees only reviews they wrote
      if (!mongoose.Types.ObjectId.isValid(req.user.user_id)) return res.status(403).json({ error: 'Invalid user session' });
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

// ---------- POST /api/reviews ----------
router.post('/', verifyToken, async (req, res) => {
  try {
    const { appointmentId, staffId, serviceId, rating, comment } = req.body;

    // Validate required fields
    if (!appointmentId || !staffId || !serviceId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(appointmentId) ||
      !mongoose.Types.ObjectId.isValid(staffId) ||
      !mongoose.Types.ObjectId.isValid(serviceId)
    ) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Prevent duplicate review for same appointment
    const existing = await Review.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ error: 'Review already submitted for this appointment' });
    }

    const review = new Review({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      userId: new mongoose.Types.ObjectId(req.user.user_id),
      staffId: new mongoose.Types.ObjectId(staffId),
      serviceId: new mongoose.Types.ObjectId(serviceId),
      rating,
      comment: comment || ''
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted successfully', review });

  } catch (error) {
    console.error('[REVIEWS] Submit error:', error.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
