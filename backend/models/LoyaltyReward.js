const mongoose = require('mongoose');

const loyaltyRewardSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String },
  pointsRequired: { type: Number, required: true, min: 1 },
  // ✅ NEW: percentage discount this reward gives on any service
  discountPercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

loyaltyRewardSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.points_required = ret.pointsRequired;
    ret.discount_percentage = ret.discountPercentage; // ✅ expose to frontend
    ret.is_active = ret.isActive;
    ret.created_at = ret.createdAt;

    delete ret._id;
    delete ret.__v;
    delete ret.pointsRequired;
    delete ret.discountPercentage;
    delete ret.isActive;
    delete ret.createdAt;
    return ret;
  }
});

module.exports = mongoose.model('LoyaltyReward', loyaltyRewardSchema);