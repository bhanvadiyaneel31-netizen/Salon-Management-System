/**
 * DEVELOPMENT ONLY: Utility to reset default user passwords.
 * DO NOT USE IN PRODUCTION.
 */
if (process.env.NODE_ENV === 'production') {
  console.error('This script cannot be run in production mode.');
  process.exit(1);
}

const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'salon.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
});

async function resetPasswords() {
  const adminPassStr = process.env.ADMIN_PASSWORD || 'admin123';
  const staffPassStr = process.env.STAFF_PASSWORD || 'password123';
  
  const adminPass = await bcrypt.hash(adminPassStr, 10);
  const staffPass = await bcrypt.hash(staffPassStr, 10);

  db.serialize(() => {
    db.run("UPDATE users SET password_hash = ? WHERE email = 'admin@example.com'", [adminPass], (err) => {
      if (err) console.error('Admin update failed:', err.message);
      else console.log('Admin password reset successful');
    });

    db.run("UPDATE users SET password_hash = ? WHERE email = 'staff@example.com'", [staffPass], (err) => {
      if (err) console.error('Staff update failed:', err.message);
      else console.log('Staff password reset successful');
    });
    
    db.run("UPDATE users SET password_hash = ? WHERE email = 'customer@example.com'", [staffPass], (err) => {
       if (err) console.error('Customer update failed:', err.message);
       else console.log('Customer password reset successful');
    });
  });

  setTimeout(() => db.close(), 2000);
}

resetPasswords();
