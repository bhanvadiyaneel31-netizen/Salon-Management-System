const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await db.allAsync(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.user_id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const row = await db.getAsync(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.user_id]
    );
    res.json({ count: row.count || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT/PATCH /api/notifications/:id/read
router.put('/:id/read', verifyToken, markAsRead);
router.patch('/:id/read', verifyToken, markAsRead);

async function markAsRead(req, res) {
  try {
    const result = await db.runAsync(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.user_id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}

// POST /api/notifications/read-all
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    await db.runAsync(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [req.user.user_id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
