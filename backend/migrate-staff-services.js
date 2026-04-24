/**
 * ONE-TIME MIGRATION SCRIPT
 * --------------------------
 * This script syncs StaffProfile.services for ALL staff members
 * based on the Service.assigned_staff name arrays in the database.
 *
 * Run once with:  node migrate-staff-services.js
 *
 * Place this file in your backend root (same folder as db.js / server.js)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Service = require('./models/Service');
const StaffProfile = require('./models/StaffProfile');

async function migrate() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('❌ MONGO_URI not set in .env');

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // ── Step 1: Get all staff users ──────────────────────────────────────────
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`\n📋 Found ${staffUsers.length} staff users:`);
    staffUsers.forEach(u => console.log(`   - ${u.name} (${u._id})`));

    // ── Step 2: Get all services ─────────────────────────────────────────────
    const services = await Service.find({});
    console.log(`\n📋 Found ${services.length} services:`);
    services.forEach(s => console.log(`   - ${s.name} (${s._id}) → assigned_staff: ${JSON.stringify(s.assigned_staff || [])}`));

    // ── Step 3: Build a map of lowercase staff name → user _id ───────────────
    const nameToId = {};
    staffUsers.forEach(u => {
        nameToId[u.name.toLowerCase().trim()] = u._id;
    });

    // ── Step 4: Build a map of staff user _id → Set of service ObjectIds ─────
    const staffServiceMap = {}; // staffUserId (string) → Set of service ObjectIds
    staffUsers.forEach(u => {
        staffServiceMap[u._id.toString()] = new Set();
    });

    services.forEach(service => {
        const assignedNames = service.assigned_staff || [];
        assignedNames.forEach(name => {
            const userId = nameToId[name.toLowerCase().trim()];
            if (userId) {
                staffServiceMap[userId.toString()].add(service._id.toString());
            } else {
                console.warn(`   ⚠️  Could not match staff name "${name}" from service "${service.name}"`);
            }
        });
    });

    // ── Step 5: For each staff, ensure StaffProfile exists & update services ─
    console.log('\n🔄 Updating StaffProfile.services...\n');

    for (const user of staffUsers) {
        const userId = user._id.toString();
        const serviceIds = [...staffServiceMap[userId]].map(id => new mongoose.Types.ObjectId(id));

        let profile = await StaffProfile.findOne({ userId: user._id });

        if (!profile) {
            // Create missing profile
            profile = await StaffProfile.create({
                userId: user._id,
                category: 'General',
                specialty: '',
                rating: 0,
                isAvailable: true,
                services: serviceIds,
            });
            console.log(`   ✅ CREATED StaffProfile for "${user.name}" with ${serviceIds.length} service(s)`);
        } else {
            // Merge existing services with newly found ones (addToSet behaviour)
            const existingIds = profile.services.map(id => id.toString());
            const newIds = serviceIds.map(id => id.toString());
            const merged = [...new Set([...existingIds, ...newIds])].map(id => new mongoose.Types.ObjectId(id));

            await StaffProfile.findOneAndUpdate(
                { userId: user._id },
                { $set: { services: merged } }
            );
            console.log(`   ✅ UPDATED StaffProfile for "${user.name}" → ${merged.length} service(s): [${merged.map(id => id.toString()).join(', ')}]`);
        }
    }

    // ── Step 6: Print final state ─────────────────────────────────────────────
    console.log('\n📊 Final StaffProfile.services state:');
    const allProfiles = await StaffProfile.find({}).populate('services', 'name');
    for (const p of allProfiles) {
        const user = staffUsers.find(u => u._id.toString() === p.userId.toString());
        const serviceNames = p.services.map(s => s.name || s.toString()).join(', ');
        console.log(`   - ${user?.name || p.userId}: [${serviceNames || 'none'}]`);
    }

    console.log('\n✅ Migration complete! All StaffProfile.services are now synced.\n');
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});