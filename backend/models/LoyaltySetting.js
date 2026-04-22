const mongoose = require('mongoose');

// Singleton document — only one row is ever active (same as SQLite behavior).
const loyaltySettingSchema = new mongoose.Schema({
  pointsPerDollar:    { type: Number, default: 1 },
  redemptionRate:     { type: Number, default: 0.10 },   // 1 point = $0.10
  maxDiscountPercent: { type: Number, default: 30 },
  minBookingAmount:   { type: Number, default: 10.00 },
  pointsExpiryDays:   { type: Number, default: 365 },
}, { timestamps: true });

loyaltySettingSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id                  = ret._id.toString();
    ret.points_per_dollar   = ret.pointsPerDollar;
    ret.redemption_rate     = ret.redemptionRate;
    ret.max_discount_percent = ret.maxDiscountPercent;
    ret.min_booking_amount  = ret.minBookingAmount;
    ret.points_expiry_days  = ret.pointsExpiryDays;
    ret.updated_at          = ret.updatedAt;
    
    delete ret._id;
    delete ret.__v;
    delete ret.pointsPerDollar;
    delete ret.redemptionRate;
    delete ret.maxDiscountPercent;
    delete ret.minBookingAmount;
    delete ret.pointsExpiryDays;
    delete ret.updatedAt;
    return ret;
  }
});

module.exports = mongoose.model('LoyaltySetting', loyaltySettingSchema);
