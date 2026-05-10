const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Appointment, Service, StaffProfile, User, Notification, LoyaltySetting, LoyaltyPointsHistory, LoyaltyReward, Review } = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { sendAppointmentEmail } = require('../services/emailService');

// ---------- Helpers ----------

const populateAppointment = (query) =>
  query
    .populate('customerId', 'name email phone loyaltyPoints')
    .populate('staffId', 'name email')
    .populate('serviceId', 'name duration category');

const fetchAppointment = (id) =>
  populateAppointment(Appointment.findById(id));

const mapAppointment = (doc) => {
  if (!doc) return null;
  const cu = doc.customerId;
  const st = doc.staffId;
  const sv = doc.serviceId;
  return {
    id: doc._id.toString(),
    customer: cu ? { id: cu._id.toString(), name: cu.name, email: cu.email, phone: cu.phone, loyalty_points: cu.loyaltyPoints || 0 } : null,
    staff: st ? { id: st._id.toString(), name: st.name, email: st.email } : null,
    service: sv ? { id: sv._id.toString(), name: sv.name, duration: sv.duration, category: sv.category } : null,
    appointment_date: doc.appointmentDate,
    appointment_time: doc.appointmentTime,
    status: doc.status,
    notes: doc.notes,
    price: doc.price,
    points_redeemed: doc.pointsRedeemed || 0,
    discount_amount: doc.discountAmount || 0,
    original_amount: doc.originalAmount || doc.price || 0,
    final_amount: doc.finalAmount || doc.price || 0,
    discount_type: doc.discountType || null,
    reward_id: doc.rewardId?.toString() || null,
    rating: doc.rating,
    review: doc.review,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
};

const notify = (userId, title, message, type, appointmentId = null) =>
  new Notification({ userId, title, message, type, appointmentId }).save().catch(() => { });

// ---------- Routes ----------

// GET /api/appointments
router.get('/', verifyToken, async (req, res) => {
  const { status, date, date_from, date_to } = req.query;
  const user = req.user;

  try {
    const filter = {};
    const userObjectId = new mongoose.Types.ObjectId(user.user_id);

    // Role-based filtering
    if (user.role === 'customer') {
      filter.customerId = userObjectId;
    } else if (user.role === 'staff') {
      filter.staffId = userObjectId;
    }
    // Admin sees everything (no role filter added)

    if (status) filter.status = status;
    if (date) filter.appointmentDate = date;

    if (date_from || date_to) {
      filter.appointmentDate = {};
      if (date_from) filter.appointmentDate.$gte = date_from;
      if (date_to) filter.appointmentDate.$lte = date_to;
    }

    console.log(`[API] Fetching appointments for ${user.role} (ID: ${user.user_id}) with filter:`, JSON.stringify(filter));

    filter.isDeleted = { $ne: true };
    const docs = await populateAppointment(
      Appointment.find(filter).sort({ appointmentDate: -1, appointmentTime: -1 })
    );
    console.log(`[API] Found ${docs.length} appointments for ${user.role}.`);
    res.json(docs.map(mapAppointment));
  } catch (error) {
    console.error('[FETCH APPOINTMENTS ERROR]', {
      role: user.role,
      userId: user.user_id,
      query: req.query,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/slots  (public — no auth required; used by guest booking flow)
router.get('/slots', async (req, res) => {
  const { date, staff_id, service_id, exclude_appointment_id } = req.query;
  if (!date || !staff_id || !service_id)
    return res.status(400).json({ error: 'Valid date, staff_id, and service_id are required' });

  try {
    const service = await Service.findById(service_id);
    if (!service || !service.isActive)
      return res.status(400).json({ error: 'This service is currently inactive' });

    const staffProfile = await StaffProfile.findOne({ userId: new mongoose.Types.ObjectId(staff_id) });
    if (!staffProfile || !staffProfile.isAvailable)
      return res.status(400).json({ error: 'This staff member is currently inactive' });

    const requestedDuration = service.duration || 30;
    const startHour = 10, endHour = 21;
    const allSlots = [];
    let cur = startHour * 60;
    while (cur + requestedDuration <= endHour * 60) {
      const h = Math.floor(cur / 60), m = cur % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      cur += requestedDuration;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = date === todayStr;

    const existingFilter = {
      staffId: new mongoose.Types.ObjectId(staff_id),
      appointmentDate: date,
      status: { $ne: 'cancelled' }
    };
    if (exclude_appointment_id) existingFilter._id = { $ne: new mongoose.Types.ObjectId(exclude_appointment_id) };

    const existing = await Appointment.find(existingFilter).populate('serviceId', 'duration');
    const blocked = existing.map(a => {
      const [h, m] = a.appointmentTime.substring(0, 5).split(':').map(Number);
      const start = h * 60 + m;
      return { start, end: start + (a.serviceId?.duration || 30) };
    });

    const available = allSlots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      const sm = h * 60 + m;
      if (isToday && sm <= nowMinutes + 15) return false;
      const se = sm + requestedDuration;
      return !blocked.some(b => sm < b.end && se > b.start);
    });

    res.json(available);
  } catch (error) {
    console.error('[SLOTS ERROR]', { staff_id, service_id, date, error: error.message });
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// GET /api/appointments/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid appointment ID' });
    const doc = await fetchAppointment(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ error: 'Appointment not found' });

    const custId = doc.customerId?._id.toString();
    const staffId = doc.staffId?._id?.toString();
    if (req.user.role === 'customer' && custId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized to view this appointment' });
    if (req.user.role === 'staff' && staffId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized to view this appointment' });

    res.json(mapAppointment(doc));
  } catch (error) {
    console.error('[FETCH APPOINTMENT ERROR]', { id: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments
router.post('/', verifyToken, async (req, res) => {
  const { service_id, staff_id, appointment_date, appointment_time, notes } = req.body;
  if (!service_id || !appointment_date || !appointment_time)
    return res.status(400).json({ error: 'Service ID, date, and time are required' });

  // ✅ FIX STB-008: validate date format strictly
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date))
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });

  // ✅ FIX STB-020: validate time format strictly
  if (!/^\d{2}:\d{2}$/.test(appointment_time))
    return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });

  const now = new Date();
  const [hours, minutes] = appointment_time.split(':').map(Number);
  const bookingDate = new Date(appointment_date);
  bookingDate.setHours(hours, minutes, 0, 0);
  if (bookingDate.getTime() < now.getTime() - 5 * 60 * 1000)
    return res.status(400).json({ error: 'Cannot book appointment in the past' });

  // ✅ FIX STB-003: wrap entire booking + loyalty in a MongoDB transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const service = await Service.findById(service_id).session(session);
    if (!service || !service.isActive)
      throw Object.assign(new Error('Service not found or inactive'), { status: 404 });

    // ✅ FIX SEV-008: validate price and duration are positive
    if (service.price <= 0) throw Object.assign(new Error('Service has invalid price'), { status: 400 });
    if (service.duration <= 0) throw Object.assign(new Error('Service has invalid duration'), { status: 400 });

    const requestedDuration = service.duration;
    const startHour = 10, endHour = 21;
    const reqMinutes = hours * 60 + minutes;

    if (reqMinutes < startHour * 60 || reqMinutes + requestedDuration > endHour * 60)
      throw Object.assign(new Error('Selected time is outside business hours (10:00 - 21:00)'), { status: 400 });

    if ((reqMinutes - startHour * 60) % requestedDuration !== 0)
      throw Object.assign(new Error(`Invalid time slot. Slots must start at ${requestedDuration} minute intervals from 10:00`), { status: 400 });

    if (staff_id) {
      const staffProfile = await StaffProfile.findOne({ userId: staff_id }).session(session);
      if (!staffProfile || !staffProfile.isAvailable)
        throw Object.assign(new Error('This staff member is currently inactive'), { status: 400 });

      if (service.category && staffProfile.category && staffProfile.category !== service.category)
        throw Object.assign(new Error(`This staff member handles ${staffProfile.category} services, not ${service.category}`), { status: 400 });
    }

    const customer_id = req.user.role === 'customer' ? req.user.user_id : req.body.customer_id;

    // ✅ FIX SEV-007: validate customer_id refers to a real customer
    const customer = await User.findById(customer_id).session(session);
    if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
    if (customer.role !== 'customer') throw Object.assign(new Error('Provided customer_id is not a customer account'), { status: 400 });

    const settings = await LoyaltySetting.findOne().sort({ _id: -1 }).session(session);

    const { reward_id, points_redeemed, use_all_points } = req.body;
    let discountAmount = 0;
    let pointsToRedeem = 0;

    if (reward_id && (points_redeemed || use_all_points))
      throw Object.assign(new Error('Cannot use both a fixed reward and custom points at the same time'), { status: 400 });

    let rewardDiscountPct = null; // ✅ track if reward has its own % discount

    if (reward_id) {
      const reward = await LoyaltyReward.findById(reward_id).session(session);
      if (!reward || !reward.isActive)
        throw Object.assign(new Error('Invalid or inactive reward selected'), { status: 400 });
      pointsToRedeem = reward.pointsRequired;
      // ✅ if reward has a discount percentage, use it directly
      if (reward.discountPercentage > 0) {
        rewardDiscountPct = reward.discountPercentage;
      }
    } else if (use_all_points) {
      pointsToRedeem = customer.loyaltyPoints || 0;
    } else if (points_redeemed) {
      pointsToRedeem = parseInt(points_redeemed) || 0;
    }

    if (pointsToRedeem > 0) {
      if (service.price < (settings?.minBookingAmount || 0))
        throw Object.assign(new Error(`Minimum booking amount for point redemption is $${settings.minBookingAmount}`), { status: 400 });

      if (rewardDiscountPct !== null) {
        // ✅ reward has its own % — use it directly (Bronze=10%, Silver=25%, Gold=50%)
        discountAmount = service.price * (rewardDiscountPct / 100);
      } else {
        // fallback: points-based redemption using redemption rate
        const redemptionRate = settings?.redemptionRate || 0.1;
        discountAmount = pointsToRedeem * redemptionRate;
        const maxDiscountPercent = settings?.maxDiscountPercent || 30;
        const maxAllowed = service.price * (maxDiscountPercent / 100);
        if (discountAmount > maxAllowed) {
          discountAmount = maxAllowed;
          pointsToRedeem = Math.ceil(discountAmount / redemptionRate);
        }
      }
    }

    const originalAmount = service.price;
    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const discountType = pointsToRedeem > 0 ? 'loyalty' : null;

    // ✅ FIX STB-002: Appointment.create inside transaction
    // If a duplicate booking slips through the race window, the unique index
    // on {staffId, appointmentDate, appointmentTime} throws a duplicate key
    // error here, which aborts the whole transaction cleanly.
    const [apt] = await Appointment.create([{
      customerId: new mongoose.Types.ObjectId(customer_id),
      staffId: staff_id ? new mongoose.Types.ObjectId(staff_id) : null,
      serviceId: new mongoose.Types.ObjectId(service_id),
      appointmentDate: appointment_date,
      appointmentTime: appointment_time,
      notes,
      price: finalAmount,
      status: 'pending',
      pointsRedeemed: pointsToRedeem,
      discountAmount,
      originalAmount,
      finalAmount,
      discountType,
      rewardId: reward_id ? new mongoose.Types.ObjectId(reward_id) : null,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    if (staff_id) await notify(staff_id, 'New Appointment', `New booking for ${service.name} on ${appointment_date} at ${appointment_time}`, 'new_appointment', apt._id);

    const populated = await fetchAppointment(apt._id);
    const mapped = mapAppointment(populated);

    sendAppointmentEmail({
      to: mapped.customer?.email, customerName: mapped.customer?.name,
      serviceName: mapped.service?.name, status: 'pending',
      date: apt.appointmentDate, time: apt.appointmentTime,
      staffName: mapped.staff?.name, type: 'booked',
    }).catch(err => console.error('[EMAIL ERROR]', err.message));

    res.status(201).json(mapped);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // ✅ FIX STB-002: handle duplicate key = double booking attempt
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This time slot was just booked. Please choose another slot.' });
    }

    console.error('[APPOINTMENT BOOKING ERROR]', { body: req.body, user: req.user, error: error.message });
    const status = error.status || 500;
    res.status(status).json({ error: status === 500 ? 'Failed to book appointment' : error.message });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status, notes } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid appointment ID' });
    const apt = await Appointment.findById(req.params.id);
    if (!apt || apt.isDeleted) return res.status(404).json({ error: 'Appointment not found' });

    const custId = apt.customerId.toString();
    const staffId = apt.staffId?.toString();
    const prevStatus = apt.status;

    if (req.user.role === 'customer') {
      if (custId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized to access this appointment' });
      if (status !== 'cancelled') return res.status(403).json({ error: 'Customers can only cancel their own appointments' });
      if (prevStatus !== 'pending') return res.status(400).json({ error: 'Only pending appointments can be cancelled by customers' });
    } else if (req.user.role === 'staff') {
      if (staffId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized to manage this appointment' });
      if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) return res.status(403).json({ error: 'Unauthorized status transition for staff' });
    }

    const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['in-progress', 'cancelled'], 'in-progress': ['completed', 'cancelled'] };
    if (req.user.role !== 'admin' && (!transitions[prevStatus] || !transitions[prevStatus].includes(status)))
      return res.status(400).json({ error: `Cannot change status from ${prevStatus} to ${status}` });

    apt.status = status;
    if (notes) apt.notes = notes;
    apt.updatedAt = new Date();
    await apt.save();

    const populated = await fetchAppointment(apt._id);
    const mapped = mapAppointment(populated);

    await notify(custId, `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`, `Your appointment for ${mapped.service?.name} has been ${status}.`, 'update', apt._id);
    if (staffId) await notify(staffId, 'Status Update', `Appointment for ${mapped.customer?.name} is now ${status}.`, 'update', apt._id);

    // Award loyalty points on completion
    if (status === 'completed' && prevStatus !== 'completed') {
      const settings = await LoyaltySetting.findOne().sort({ _id: -1 });
      const multiplier = settings?.pointsPerDollar || 1;
      const finalPrice = apt.price - (apt.discountAmount || 0);
      const pointsEarned = Math.floor(finalPrice * multiplier);

      if (pointsEarned > 0) {
        const expiryDays = settings?.pointsExpiryDays || 365;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);

        await User.findByIdAndUpdate(custId, { $inc: { loyaltyPoints: pointsEarned } });
        await LoyaltyPointsHistory.create({
          userId: custId, points: pointsEarned, pointsRemaining: pointsEarned,
          type: 'earn', reason: `Earned from appointment #${apt._id}`, expiryDate,
        });
      }
    }

    if (prevStatus !== status) {
      const emailType = status === 'confirmed' ? 'confirmed' : status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'update';
      sendAppointmentEmail({
        to: mapped.customer?.email, customerName: mapped.customer?.name,
        serviceName: mapped.service?.name, status,
        date: apt.appointmentDate, time: apt.appointmentTime,
        staffName: mapped.staff?.name, type: emailType,
      }).catch(err => console.error('[EMAIL ERROR]', err.message));
    }

    res.json(mapped);
  } catch (error) {
    console.error('[STATUS UPDATE ERROR]', { id: req.params.id, status, error: error.message });
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// POST /api/appointments/:id/review
router.post('/:id/review', verifyToken, async (req, res) => {
  const { rating, review } = req.body;
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can leave reviews' });

  const ratingNum = Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5)
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
  const ratingInt = Math.round(ratingNum);

  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt || apt.isDeleted) return res.status(404).json({ error: 'Appointment not found' });
    if (apt.customerId.toString() !== req.user.user_id) return res.status(403).json({ error: 'Not authorized' });
    if (apt.status !== 'completed') return res.status(400).json({ error: 'Can only review completed appointments' });

    apt.rating = ratingInt;
    apt.review = review;
    await apt.save();

    // Also create a standalone Review document for the staff feedback feature
    await Review.create({
      userId: new mongoose.Types.ObjectId(req.user.user_id),
      staffId: apt.staffId,
      serviceId: apt.serviceId,
      rating: ratingInt,
      comment: review
    });

    let newAvgRating = null;
    if (apt.staffId) {
      const agg = await Appointment.aggregate([
        { $match: { staffId: apt.staffId, rating: { $ne: null }, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]);
      if (agg.length > 0 && agg[0].avg != null) {
        newAvgRating = parseFloat(agg[0].avg.toFixed(2));
        await StaffProfile.findOneAndUpdate({ userId: apt.staffId }, { rating: newAvgRating });
      }
    }

    res.json({ message: 'Review submitted successfully', staff_rating: newAvgRating });
  } catch (error) {
    console.error('[REVIEW ERROR]', error.message);
    console.error('[REVIEW ERROR FULL]', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// PATCH /api/appointments/:id  (general update / reschedule by admin/staff)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid appointment ID' });
    const apt = await Appointment.findById(req.params.id);
    if (!apt || apt.isDeleted) return res.status(404).json({ error: 'Appointment not found' });

    const custId = apt.customerId.toString();
    const staffId = apt.staffId?.toString();

    if (req.user.role === 'staff' && staffId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized to manage this appointment' });
    if (req.user.role === 'customer') {
      if (custId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized' });
      if (apt.status !== 'pending') return res.status(400).json({ error: 'Only pending appointments can be rescheduled' });
    }

    const { appointment_date, appointment_time, staff_id, notes } = req.body;
    if (appointment_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date))
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      apt.appointmentDate = appointment_date;
    }
    if (appointment_time) {
      if (!/^\d{2}:\d{2}$/.test(appointment_time))
        return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
      apt.appointmentTime = appointment_time;
    }
    if (staff_id) apt.staffId = new mongoose.Types.ObjectId(staff_id);
    if (notes) apt.notes = notes;
    await apt.save();

    const populated = await fetchAppointment(apt._id);
    const mapped = mapAppointment(populated);

    await notify(custId, 'Appointment Updated', 'Your appointment has been rescheduled/updated. Check details for changes.', 'update', apt._id);
    if (staff_id && staff_id !== staffId) await notify(staff_id, 'New Assignment', `You have been assigned to a new appointment on ${apt.appointmentDate}.`, 'assignment', apt._id);

    sendAppointmentEmail({
      to: mapped.customer?.email, customerName: mapped.customer?.name,
      serviceName: mapped.service?.name, status: apt.status,
      date: apt.appointmentDate, time: apt.appointmentTime,
      staffName: mapped.staff?.name, type: 'update',
    }).catch(err => console.error('[EMAIL ERROR]', err.message));

    res.json(mapped);
  } catch (error) {
    console.error('[APPOINTMENT UPDATE ERROR]', { id: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to update appointment details' });
  }
});

// PATCH /api/appointments/:id/reschedule
router.patch('/:id/reschedule', verifyToken, async (req, res) => {
  const { newDate, newTime } = req.body;
  if (!newDate || !newTime) return res.status(400).json({ error: 'New date and time are required' });

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid appointment ID' });
    const populated = await fetchAppointment(req.params.id);
    if (!populated || populated.isDeleted) return res.status(404).json({ error: 'Appointment not found' });

    const custId = populated.customerId._id.toString();
    const staffId = populated.staffId?._id?.toString();

    if (req.user.role === 'customer') {
      if (custId !== req.user.user_id) return res.status(403).json({ error: 'Not authorized' });
      if (populated.status !== 'pending') return res.status(400).json({ error: 'Only pending appointments can be rescheduled by customers' });
    } else if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Not authorized to reschedule appointments' });
    }

    const now = new Date();
    const [hours, minutes] = newTime.split(':').map(Number);
    const bookingDate = new Date(newDate);
    bookingDate.setHours(hours, minutes, 0, 0);
    if (bookingDate.getTime() < now.getTime() - 5 * 60 * 1000)
      return res.status(400).json({ error: 'Cannot reschedule to a past time' });

    const startHour = 10, endHour = 21;
    const reqMinutes = hours * 60 + minutes;
    const duration = populated.serviceId.duration || 30;
    if (reqMinutes < startHour * 60 || reqMinutes + duration > endHour * 60)
      return res.status(400).json({ error: 'Selected time is outside business hours (10:00 - 21:00)' });
    if ((reqMinutes - startHour * 60) % duration !== 0)
      return res.status(400).json({ error: `Invalid time slot. For this service, slots must start at ${duration} minute intervals from 10:00.` });

    if (staffId) {
      const staffProf = await StaffProfile.findOne({ userId: new mongoose.Types.ObjectId(staffId) });
      if (!staffProf || !staffProf.isAvailable)
        return res.status(400).json({ error: 'Assigned staff is currently unavailable' });

      const reqEnd = reqMinutes + duration;
      const existing = await Appointment.find({
        staffId: new mongoose.Types.ObjectId(staffId),
        appointmentDate: newDate,
        status: { $ne: 'cancelled' },
        isDeleted: { $ne: true },
        _id: { $ne: populated._id }
      }).populate('serviceId', 'duration');
      for (const b of existing) {
        const [h, m] = b.appointmentTime.substring(0, 5).split(':').map(Number);
        const es = h * 60 + m, ee = es + (b.serviceId?.duration || 30);
        if (reqMinutes < ee && reqEnd > es) return res.status(409).json({ error: 'This staff member is already booked during this time' });
      }
    }

    await Appointment.findByIdAndUpdate(populated._id, { appointmentDate: newDate, appointmentTime: newTime });

    await notify(custId, 'Appointment Rescheduled', `Your appointment for ${populated.serviceId.name} has been rescheduled to ${newDate} at ${newTime}.`, 'reschedule', populated._id);
    if (staffId) await notify(staffId, 'Appointment Rescheduled', `Appointment for ${populated.customerId.name} has been rescheduled to ${newDate} at ${newTime}.`, 'reschedule', populated._id);

    sendAppointmentEmail({
      to: populated.customerId.email, customerName: populated.customerId.name,
      serviceName: populated.serviceId.name, status: populated.status,
      date: newDate, time: newTime,
      staffName: populated.staffId?.name || 'Assigned Staff', type: 'reschedule',
    }).catch(err => console.error('[EMAIL ERROR]', err.message));

    const updated = await fetchAppointment(populated._id);
    res.json(mapAppointment(updated));
  } catch (error) {
    console.error('[RESCHEDULE ERROR]', { id: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt || apt.isDeleted) return res.status(404).json({ error: 'Appointment not found' });

    // ✅ FIX STB-021: soft delete — preserve financial history
    await Appointment.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(req.user.user_id),
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;