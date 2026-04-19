const { db } = require('./db');

async function migrate() {
  console.log("Starting database migration to support 'in-progress' status...");
  try {
    await db.runAsync("PRAGMA foreign_keys=OFF");
    
    await db.runAsync("BEGIN TRANSACTION");
    
    await db.runAsync(`
      CREATE TABLE appointments_new (
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
        CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
        CHECK (price >= 0),
        CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
      )
    `);
    
    await db.runAsync("INSERT INTO appointments_new SELECT * FROM appointments");
    
    await db.runAsync("DROP TABLE appointments");
    
    await db.runAsync("ALTER TABLE appointments_new RENAME TO appointments");
    
    await db.runAsync("COMMIT");
    
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
    await db.runAsync("ROLLBACK").catch(() => {});
  } finally {
    if (db) {
      try {
        await db.runAsync("PRAGMA foreign_keys=ON");
      } catch (pragmaErr) {
        console.error("Failed to re-enable foreign keys:", pragmaErr);
      }
    }
    process.exit();
  }
}

migrate();
