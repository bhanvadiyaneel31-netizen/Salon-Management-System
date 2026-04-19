const { db } = require('./db');

async function migrate() {
  console.log('Starting migration: adding address and profile_image to users table...');
  
  try {
    await db.runAsync(`ALTER TABLE users ADD COLUMN address TEXT`);
    console.log('Added address column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Address column already exists');
    } else {
      console.error('Error adding address column:', err.message);
    }
  }

  try {
    await db.runAsync(`ALTER TABLE users ADD COLUMN profile_image TEXT`);
    console.log('Added profile_image column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Profile_image column already exists');
    } else {
      console.error('Error adding profile_image column:', err.message);
    }
  }

  console.log('Migration completed!');
}

migrate();
