const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../backend/salon.db');
const db = new sqlite3.Database(dbPath);

db.get("SELECT is_active FROM services WHERE is_active = 0 LIMIT 1", (err, row) => {
  if (err) {
    console.error('Database error:', err.message);
  } else if (!row) {
    console.log('No inactive services found.');
  } else {
    console.log('is_active value type:', typeof row.is_active);
    console.log('is_active value:', row.is_active);
    console.log('Boolean(is_active):', Boolean(row.is_active));
  }
  db.close();
});
