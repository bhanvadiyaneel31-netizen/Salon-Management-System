const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  serviceId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  // Stored as "YYYY-MM-DD" string for simple string-based date comparisons (matches SQLite behavior)
  appointmentDate: { type: String, required: true },
  // Stored as "HH:MM" string
  appointmentTime: { type: String, required: true },
  status:          { type: String, enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  notes:           { type: String },
  price:           { type: Number, required: true, min: 0 },
  rating:          { type: Number, min: 1, max: 5, default: null },
  review:          { type: String },
  // Loyalty / financial tracking
  pointsRedeemed:  { type: Number, default: 0 },
  discountAmount:  { type: Number, default: 0 },
  originalAmount:  { type: Number, default: 0 },
  finalAmount:     { type: Number, default: 0 },
  discountType:    { type: String, default: null },
  rewardId:        { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyReward', default: null },
}, { timestamps: true });

appointmentSchema.index({ customerId: 1 });
appointmentSchema.index({ staffId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

appointmentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id               = ret._id.toString();
    ret.appointment_date = ret.appointmentDate;
    ret.appointment_time = ret.appointmentTime;
    ret.points_redeemed  = ret.pointsRedeemed;
    ret.discount_amount  = ret.discountAmount;
    ret.original_amount  = ret.originalAmount;
    ret.final_amount     = ret.finalAmount;
    ret.discount_type    = ret.discountType;
    ret.reward_id        = ret.rewardId?.toString() || null;
    ret.created_at       = ret.createdAt;
    ret.updated_at       = ret.updatedAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
