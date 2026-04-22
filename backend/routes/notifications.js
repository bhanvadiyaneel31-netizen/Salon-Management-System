const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Notification } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.user_id);
    const notifications = await Notification.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('[NOTIFICATIONS ERROR]', { user: req.user.user_id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.user_id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /PATCH /api/notifications/:id/read
router.put('/:id/read',   verifyToken, markAsRead);
router.patch('/:id/read', verifyToken, markAsRead);

async function markAsRead(req, res) {
  try {
    const result = await Notification.updateOne(
      { _id: req.params.id, userId: req.user.user_id },
      { $set: { isRead: true } }
    );
    if (result.modifiedCount === 0)
      return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}

// POST /api/notifications/read-all
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.user_id }, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
