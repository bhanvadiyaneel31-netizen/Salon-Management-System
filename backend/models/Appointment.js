const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  appointmentDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // ✅ FIX STB-008: validate date format
  appointmentTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },        // ✅ FIX STB-020: validate time format
  status: { type: String, enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, min: 1, max: 5, default: null },
  review: { type: String },
  pointsRedeemed: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  originalAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  discountType: { type: String, default: null },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyReward', default: null },

  // ✅ FIX STB-021: soft delete fields
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

appointmentSchema.index({ customerId: 1 });
appointmentSchema.index({ staffId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ isDeleted: 1 }); // ✅ FIX STB-021: index for soft delete filter

// ✅ FIX STB-002: compound unique index to prevent double booking at DB level
// partial index only applies to non-cancelled appointments
appointmentSchema.index(
  { staffId: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      staffId: { $exists: true, $ne: null },
      status: { $nin: ['cancelled'] }
    },
    name: 'no_double_booking'
  }
);

appointmentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.appointment_date = ret.appointmentDate;
    ret.appointment_time = ret.appointmentTime;
    ret.points_redeemed = ret.pointsRedeemed;
    ret.discount_amount = ret.discountAmount;
    ret.original_amount = ret.originalAmount;
    ret.final_amount = ret.finalAmount;
    ret.discount_type = ret.discountType;
    ret.reward_id = ret.rewardId?.toString() || null;
    ret.created_at = ret.createdAt;
    ret.updated_at = ret.updatedAt;

    delete ret._id;
    delete ret.__v;
    delete ret.appointmentDate;
    delete ret.appointmentTime;
    delete ret.pointsRedeemed;
    delete ret.discountAmount;
    delete ret.originalAmount;
    delete ret.finalAmount;
    delete ret.discountType;
    delete ret.rewardId;
    delete ret.createdAt;
    delete ret.updatedAt;

    // ✅ don't expose soft delete internals to frontend
    delete ret.isDeleted;
    delete ret.deletedAt;
    delete ret.deletedBy;
    return ret;
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);