const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'salon.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Helper for promises since sqlite3 doesn't support them out of the box
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

async function initDb() {
  db.serialize(async () => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");
    
    // 1. users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(20) NOT NULL DEFAULT 'customer',
      loyalty_points INTEGER DEFAULT 0,
      reminder_email BOOLEAN DEFAULT 1,
      reminder_sms BOOLEAN DEFAULT 1,
      reminder_timing VARCHAR(10) DEFAULT '24h',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (role IN ('customer', 'staff', 'admin'))
    )`);

    // 2. services
    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (duration > 0),
      CHECK (price >= 0),
      CHECK (category IN ('Hair', 'Facial', 'Nails', 'Massage', 'Wellness', 'Beauty'))
    )`);

    // 3. staff_profiles
    db.run(`CREATE TABLE IF NOT EXISTS staff_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      specialty VARCHAR(100),
      rating DECIMAL(3, 2) DEFAULT 0.00,
      is_available BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CHECK (rating >= 0 AND rating <= 5)
    )`);

    // 4. staff_service_assignments
    db.run(`CREATE TABLE IF NOT EXISTS staff_service_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      UNIQUE(staff_id, service_id)
    )`);

    // 5. appointments
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      staff_id INTEGER,
      service_id INTEGER NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      price DECIMAL(10, 2) NOT NULL,
      rating INTEGER,
      review TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
      CHECK (price >= 0),
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
    )`);

    // 6. notifications
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  });

  // Check if we need to insert dummy data
  const row = await db.getAsync("SELECT COUNT(*) as count FROM users");
  if (row.count === 0) {
    console.log("Empty database detected. Populating with initial dummy data...");
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // Insert Users
    const users = [
      ['John Customer', 'customer@example.com', passwordHash, '+1 (555) 123-4567', 'customer', 100],
      ['Sarah Staff', 'staff@example.com', passwordHash, '+1 (555) 234-5678', 'staff', 0],
      ['Admin User', 'admin@example.com', passwordHash, '+1 (555) 345-6789', 'admin', 0],
      ['Emma Wilson', 'emma@salon.com', passwordHash, '+1 (555) 456-7890', 'staff', 0],
      ['Lisa Davis', 'lisa@salon.com', passwordHash, '+1 (555) 567-8901', 'staff', 0]
    ];

    for (const u of users) {
      await db.runAsync(
        "INSERT INTO users (name, email, password_hash, phone, role, loyalty_points) VALUES (?, ?, ?, ?, ?, ?)",
        u
      );
    }
    
    const services = [
      ['Hair Cut & Style', 'Professional cuts, coloring, and styling', 60, 85.00, 'Hair'],
      ['Hair Coloring', 'Professional hair coloring service', 120, 150.00, 'Hair'],
      ['Signature Facial', 'Rejuvenating facial care and treatments', 75, 120.00, 'Facial'],
      ['Gel Manicure', 'Professional manicure with gel polish', 45, 65.00, 'Nails'],
      ['Spa Pedicure', 'Relaxing pedicure treatment', 60, 75.00, 'Nails'],
      ['Relaxing Massage', 'Full body relaxation massage', 90, 180.00, 'Massage']
    ];

    for (const s of services) {
      await db.runAsync(
        "INSERT INTO services (name, description, duration, price, category) VALUES (?, ?, ?, ?, ?)",
        s
      );
    }

    // Insert Staff Profiles (assuming Emma=4, Lisa=5 from our inserts since auto-increment)
    await db.runAsync("INSERT INTO staff_profiles (user_id, specialty, rating, is_available) VALUES (4, 'Hair Styling', 4.9, 1)");
    await db.runAsync("INSERT INTO staff_profiles (user_id, specialty, rating, is_available) VALUES (5, 'Facial Treatments', 4.8, 1)");

    // Insert Staff Service assignments
    await db.runAsync("INSERT INTO staff_service_assignments (staff_id, service_id) VALUES (4, 1)");
    await db.runAsync("INSERT INTO staff_service_assignments (staff_id, service_id) VALUES (4, 2)");
    await db.runAsync("INSERT INTO staff_service_assignments (staff_id, service_id) VALUES (5, 3)");

    console.log("Initial demo data seeded!");
  }
}

module.exports = { db, initDb };
