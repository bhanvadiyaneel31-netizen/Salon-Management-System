const mongoose = require('mongoose');

const loyaltyRewardSchema = new mongoose.Schema({
  title:          { type: String, required: true, maxlength: 100 },
  description:    { type: String },
  pointsRequired: { type: Number, required: true },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

loyaltyRewardSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id              = ret._id.toString();
    ret.points_required = ret.pointsRequired;
    ret.is_active       = ret.isActive;
    ret.created_at      = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('LoyaltyReward', loyaltyRewardSchema);
