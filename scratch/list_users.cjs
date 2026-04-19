const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = process.env.DB_PATH || path.join(__dirname, '../backend/salon.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name, email, role FROM users", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }
  db.close();
});
