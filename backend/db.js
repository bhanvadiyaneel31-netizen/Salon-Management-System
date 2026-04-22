require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User              = require('./models/User');
const Service           = require('./models/Service');
const StaffProfile      = require('./models/StaffProfile');
const Appointment       = require('./models/Appointment');
const Notification      = require('./models/Notification');
const LoyaltySetting    = require('./models/LoyaltySetting');
const LoyaltyPointsHistory = require('./models/LoyaltyPointsHistory');
const LoyaltyReward     = require('./models/LoyaltyReward');
const Review            = require('./models/Review');

async function seedDemoData() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const [customer, sarah, admin, emma, lisa] = await User.insertMany([
    { name: 'John Customer', email: 'customer@example.com', passwordHash, phone: '+1 (555) 123-4567', role: 'customer', loyaltyPoints: 100 },
    { name: 'Sarah Staff',   email: 'staff@example.com',   passwordHash, phone: '+1 (555) 234-5678', role: 'staff' },
    { name: 'Admin User',    email: 'admin@example.com',   passwordHash, phone: '+1 (555) 345-6789', role: 'admin' },
    { name: 'Emma Wilson',   email: 'emma@salon.com',      passwordHash, phone: '+1 (555) 456-7890', role: 'staff' },
    { name: 'Lisa Davis',    email: 'lisa@salon.com',      passwordHash, phone: '+1 (555) 567-8901', role: 'staff' },
  ]);

  const [hairCut, hairColor, facial, gelManicure, spaPedicure, massage] = await Service.insertMany([
    { name: 'Hair Cut & Style', description: 'Professional cuts, coloring, and styling',        duration: 60,  price: 85.00,  category: 'Hair' },
    { name: 'Hair Coloring',    description: 'Professional hair coloring service',               duration: 120, price: 150.00, category: 'Hair' },
    { name: 'Signature Facial', description: 'Rejuvenating facial care and treatments',          duration: 75,  price: 120.00, category: 'Facial' },
    { name: 'Gel Manicure',     description: 'Professional manicure with gel polish',            duration: 45,  price: 65.00,  category: 'Nails' },
    { name: 'Spa Pedicure',     description: 'Relaxing pedicure treatment',                      duration: 60,  price: 75.00,  category: 'Nails' },
    { name: 'Relaxing Massage', description: 'Full body relaxation massage',                     duration: 90,  price: 180.00, category: 'Massage' },
  ]);

  await StaffProfile.insertMany([
    { userId: sarah._id, category: 'Hair',   specialty: 'Hair Styling',       rating: 0, isAvailable: true, services: [hairCut._id] },
    { userId: emma._id,  category: 'Hair',   specialty: 'Hair Styling',       rating: 0, isAvailable: true, services: [hairCut._id, hairColor._id] },
    { userId: lisa._id,  category: 'Facial', specialty: 'Facial Treatments',  rating: 4.8, isAvailable: true, services: [facial._id] },
  ]);

  await Review.insertMany([
    { userId: customer._id, staffId: sarah._id, serviceId: hairCut._id, rating: 5, comment: 'Excellent service! Sarah is the best.' },
    { userId: customer._id, staffId: emma._id,  serviceId: hairColor._id, rating: 4, comment: 'Great color, took a bit longer than expected.' },
  ]);

  console.log('✅ Demo data seeded — users, services, staff profiles, and reviews created.');
}

async function initDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('❌ MONGO_URI is not set in .env. Add your MongoDB Atlas connection string.');
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      await mongoose.connect(uri, options);
      console.log('✅ Connected to MongoDB Atlas');
      break;
    } catch (err) {
      retryCount++;
      console.error(`❌ MongoDB connection attempt ${retryCount} failed:`, err.message);
      if (retryCount === maxRetries) throw err;
      console.log(`Retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Seed data only if userCount is 0 AND we are NOT in production
  // or if SEED_DATA is explicitly set to true
  const userCount = await User.countDocuments();
  if (userCount === 0 && (process.env.NODE_ENV !== 'production' || process.env.SEED_DATA === 'true')) {
    console.log('📦 Database empty — seeding demo data...');
    await seedDemoData();
  }

  // Ensure singleton loyalty settings exist
  const settingsCount = await LoyaltySetting.countDocuments();
  if (settingsCount === 0) {
    await new LoyaltySetting({}).save();
    console.log('✅ Default loyalty settings created.');
  }

  // Seed rewards catalog
  const rewardsCount = await LoyaltyReward.countDocuments();
  if (rewardsCount === 0) {
    await LoyaltyReward.insertMany([
      { title: 'Bronze Reward', description: 'Redeem 100 points for a discount on your next booking.', pointsRequired: 100 },
      { title: 'Silver Reward', description: 'Get a free Head Massage or Scalp Treatment.',            pointsRequired: 500 },
      { title: 'Gold Reward',   description: 'Get a free Basic Haircut or Signature Facial.',          pointsRequired: 1000 },
    ]);
    console.log('✅ Default rewards seeded.');
  }
}

// Handle connection errors after initial connect
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

module.exports = {
  initDb,
  User,
  Service,
  StaffProfile,
  Appointment,
  Notification,
  LoyaltySetting,
  LoyaltyPointsHistory,
  LoyaltyReward,
  Review,
};
