const mongoose = require('mongoose');

// Replaces both staff_profiles AND staff_service_assignments tables.
// assignedServiceIds is an embedded array replacing the join table.
const staffProfileSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  category:           { type: String },
  specialty:          { type: String, default: '' },
  rating:             { type: Number, default: 0.00, min: 0, max: 5 },
  isAvailable:        { type: Boolean, default: true },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
}, { timestamps: true });

staffProfileSchema.index({ isAvailable: 1 });
staffProfileSchema.index({ category: 1 });

staffProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id                   = ret._id.toString();
    ret.is_available         = ret.isAvailable;
    ret.services             = (ret.services || []).map(s => s._id?.toString() || s.toString());
    ret.assigned_service_ids = ret.services;
    ret.created_at           = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('StaffProfile', staffProfileSchema);
