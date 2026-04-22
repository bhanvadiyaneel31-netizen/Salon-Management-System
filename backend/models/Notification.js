const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, maxlength: 100 },
  message:       { type: String, required: true },
  type:          { type: String, required: true },
  isRead:        { type: Boolean, default: false },
  // appointmentId was missing from SQLite schema but used in routes — explicitly added here
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
}, { timestamps: true });

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id             = ret._id.toString();
    ret.user_id        = ret.userId?.toString();
    ret.is_read        = ret.isRead;
    ret.appointment_id = ret.appointmentId?.toString() || null;
    ret.created_at     = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
