const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true, maxlength: 100 },
  description: { type: String },
  duration:    { type: Number, required: true, min: 1 },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: ['Hair', 'Facial', 'Nails', 'Massage', 'Wellness', 'Beauty'] },
  isActive:    { type: Boolean, default: true },
  imageUrl:    { type: String },
}, { timestamps: true });

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

serviceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    // Preserve snake_case field names for frontend compatibility
    ret.is_active  = ret.isActive;
    ret.image_url  = ret.imageUrl;
    ret.created_at = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Service', serviceSchema);
