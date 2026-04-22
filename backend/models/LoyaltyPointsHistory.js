const mongoose = require('mongoose');

const loyaltyPointsHistorySchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points:          { type: Number, required: true },
  pointsRemaining: { type: Number, default: 0 },  // for FIFO deduction tracking
  type:            { type: String, enum: ['earn', 'redeem'], required: true },
  reason:          { type: String },
  expiryDate:      { type: Date, default: null },
}, { timestamps: true });

loyaltyPointsHistorySchema.index({ userId: 1 });
loyaltyPointsHistorySchema.index({ type: 1, pointsRemaining: 1 });

loyaltyPointsHistorySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id               = ret._id.toString();
    ret.user_id          = ret.userId?.toString();
    ret.points_remaining = ret.pointsRemaining;
    ret.expiry_date      = ret.expiryDate;
    ret.created_at       = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('LoyaltyPointsHistory', loyaltyPointsHistorySchema);
