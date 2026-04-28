const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { LoyaltySetting, LoyaltyPointsHistory, LoyaltyReward, User } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// ---------- Helpers ----------

const cleanupExpiredPoints = async (userId) => {
  try {
    const now = new Date();
    const expired = await LoyaltyPointsHistory.find({
      userId, type: 'earn', pointsRemaining: { $gt: 0 }, expiryDate: { $lt: now },
    });

    if (expired.length === 0) return;

    for (const entry of expired) {
      const claimedEntry = await LoyaltyPointsHistory.findOneAndUpdate(
        { _id: entry._id, pointsRemaining: { $gt: 0 } },
        { $set: { pointsRemaining: 0 } },
        { new: true }
      );

      if (claimedEntry && entry.pointsRemaining > 0) {
        const amountToDeduct = entry.pointsRemaining;

        await LoyaltyPointsHistory.create({
          userId,
          points: amountToDeduct,
          pointsRemaining: 0,
          type: 'redeem',
          reason: `Points expired (from entry #${entry._id})`
        });

        await User.findByIdAndUpdate(userId, { $inc: { loyaltyPoints: -amountToDeduct } });
        await User.findOneAndUpdate({ _id: userId, loyaltyPoints: { $lt: 0 } }, { loyaltyPoints: 0 });
      }
    }
  } catch (err) {
    console.error('Failed to cleanup expired points:', err);
  }
};

// ---------- GET /api/loyalty/history ----------
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.user_id);
    await cleanupExpiredPoints(userObjectId);
    const history = await LoyaltyPointsHistory.find({ userId: userObjectId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error('[LOYALTY HISTORY ERROR]', { user: req.user.user_id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch points history' });
  }
});

// ---------- GET /api/loyalty/settings ----------
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const settings = await LoyaltySetting.findOne().sort({ _id: -1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loyalty settings' });
  }
});

// ---------- PATCH /api/loyalty/settings (Admin only) ----------
router.patch('/settings', verifyToken, requireAdmin, async (req, res) => {
  const { points_per_dollar, redemption_rate, max_discount_percent, min_booking_amount, points_expiry_days } = req.body;
  try {
    const update = {};
    if (points_per_dollar != null) update.pointsPerDollar = points_per_dollar;
    if (redemption_rate != null) update.redemptionRate = redemption_rate;
    if (max_discount_percent != null) update.maxDiscountPercent = max_discount_percent;
    if (min_booking_amount != null) update.minBookingAmount = min_booking_amount;
    if (points_expiry_days != null) update.pointsExpiryDays = points_expiry_days;

    await LoyaltySetting.findOneAndUpdate({}, update, { sort: { _id: -1 }, upsert: true });
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update loyalty settings' });
  }
});

// ---------- GET /api/loyalty/rewards ----------
router.get('/rewards', verifyToken, async (req, res) => {
  try {
    const rewards = await LoyaltyReward.find({ isActive: true }).sort({ pointsRequired: 1 });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// ---------- POST /api/loyalty/rewards (Admin) ----------
router.post('/rewards', verifyToken, requireAdmin, async (req, res) => {
  const { title, description, points_required, discount_percentage } = req.body;

  if (!title || !points_required)
    return res.status(400).json({ error: 'Title and points_required are required' });

  // ✅ validate discount_percentage is a number between 0 and 100
  const discountPct = parseFloat(discount_percentage);
  if (discount_percentage !== undefined && isNaN(discountPct))
    return res.status(400).json({ error: 'discount_percentage must be a number' });
  const finalPct = isNaN(discountPct) ? 0 : discountPct;
  if (finalPct < 0 || finalPct > 100)
    return res.status(400).json({ error: 'discount_percentage must be between 0 and 100' });

  try {
    await LoyaltyReward.create({
      title,
      description,
      pointsRequired: parseInt(points_required),
      discountPercentage: discountPct, // ✅ save discount percentage
    });
    res.json({ message: 'Reward added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reward' });
  }
});

// ---------- PATCH /api/loyalty/rewards/:id (Admin) ----------
router.patch('/rewards/:id', verifyToken, requireAdmin, async (req, res) => {
  const { title, description, points_required, discount_percentage, is_active } = req.body;
  try {
    const update = {};
    if (title != null) update.title = title;
    if (description != null) update.description = description;
    if (points_required != null) update.pointsRequired = parseInt(points_required);
    if (is_active != null) update.isActive = is_active;

    // ✅ allow updating discount percentage
    if (discount_percentage != null) {
      const pct = parseFloat(discount_percentage);
      if (isNaN(pct))
        return res.status(400).json({ error: 'discount_percentage must be a number' });
      if (pct < 0 || pct > 100)
        return res.status(400).json({ error: 'discount_percentage must be between 0 and 100' });
      update.discountPercentage = pct;
    }

    await LoyaltyReward.findByIdAndUpdate(req.params.id, update, { runValidators: true });
    res.json({ message: 'Reward updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reward' });
  }
});

// ---------- DELETE /api/loyalty/rewards/:id (Admin) ----------
router.delete('/rewards/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await LoyaltyReward.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reward' });
  }
});

// ---------- POST /api/loyalty/adjust (Admin) ----------
router.post('/adjust', verifyToken, requireAdmin, async (req, res) => {
  const { user_id, email, points, reason, description, type } = req.body;
  const finalReason = reason || description || 'Manual adjustment by admin';

  if (!user_id && !email) return res.status(400).json({ error: 'user_id or email is required' });
  if (points === undefined || !type) return res.status(400).json({ error: 'points and type are required' });

  try {
    let targetUser;

    if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (user_id) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(user_id);
      if (isObjectId) {
        targetUser = await User.findById(user_id);
      } else {
        targetUser = await User.findOne({ email: user_id.toLowerCase().trim() });
      }
    }

    if (!targetUser) {
      return res.status(404).json({ error: `User not found with the provided ${email ? 'email' : 'identifier'}` });
    }

    const pointValue = type === 'earn' ? Math.abs(points) : -Math.abs(points);

    const updatedUser = await User.findOneAndUpdate(
      { _id: targetUser._id },
      { $inc: { loyaltyPoints: pointValue } },
      { new: true }
    );

    await LoyaltyPointsHistory.create({
      userId: targetUser._id,
      points: Math.abs(points),
      pointsRemaining: type === 'earn' ? Math.abs(points) : 0,
      type,
      reason: finalReason
    });

    res.json({
      message: 'Points adjusted successfully',
      user: {
        email: updatedUser.email,
        newPoints: updatedUser.loyaltyPoints || 0
      }
    });
  } catch (error) {
    console.error('Loyalty adjustment error:', error);
    res.status(500).json({ error: 'Failed to adjust points. ' + (error.name === 'CastError' ? 'Invalid User ID format.' : error.message) });
  }
});

module.exports = router;