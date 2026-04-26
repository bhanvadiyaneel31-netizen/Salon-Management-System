const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, maxlength: 120, lowercase: true, trim: true },
  passwordHash: { type: String },
  phone: { type: String, maxlength: 20 },
  role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
  googleId: { type: String },
  authProvider: { type: String, default: 'local' },
  loyaltyPoints: { type: Number, default: 0, min: 0 }, // ✅ FIX STB-004: floor at 0 in schema
  reminderEmail: { type: Boolean, default: true },
  reminderSms: { type: Boolean, default: true },
  reminderTiming: { type: String, default: '24h' },
  address: { type: String },
  profileImage: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Number },
}, { timestamps: true });

// ✅ FIX SEV-014: fast lookup during password reset, skip null values
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// ✅ index for loyalty point queries and atomic deduction checks
userSchema.index({ loyaltyPoints: 1 });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);