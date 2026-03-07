const { poolPromise } = require('../src/config/database');

async function addProfileImageColumn() {
  try {
    const pool = await poolPromise;

    // Check if column already exists
    const checkColumn = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image'
    `);

    if (checkColumn.recordset.length > 0) {
      console.log('✓ profile_image column already exists in users table');
      return;
    }

    // Add profile_image column
    await pool.request().query(`
      ALTER TABLE users
      ADD profile_image NVARCHAR(500) NULL
    `);

    console.log('✓ Successfully added profile_image column to users table');
  } catch (error) {
    console.error('Error adding profile_image column:', error);
    throw error;
  } finally {
    process.exit();
  }
}

addProfileImageColumn();
