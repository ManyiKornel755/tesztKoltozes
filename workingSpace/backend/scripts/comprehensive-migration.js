const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
  }
};

async function runComprehensiveMigration() {
  let pool;

  try {
    console.log('Connecting to database...\n');
    pool = await sql.connect(config);
    console.log('✓ Connected successfully!\n');

    // ============================================
    // USERS TABLE FIXES
    // ============================================
    console.log('=== USERS TABLE ===');

    // Add 'name' column (computed from first_name + last_name)
    console.log('1. Adding name column...');
    const checkName = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'name'
    `);

    if (checkName.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE users ADD name AS (first_name + ' ' + last_name) PERSISTED
      `);
      console.log('   ✓ Added computed name column');
    } else {
      console.log('   - name column already exists');
    }

    // Add 'password' column (alias for password_hash)
    console.log('2. Checking password column...');
    const checkPassword = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
    `);

    if (checkPassword.recordset.length === 0) {
      // Rename password_hash to password
      await pool.request().query(`
        EXEC sp_rename 'users.password_hash', 'password', 'COLUMN'
      `);
      console.log('   ✓ Renamed password_hash to password');
    } else {
      console.log('   - password column already exists');
    }

    // ============================================
    // MESSAGES TABLE FIXES
    // ============================================
    console.log('\n=== MESSAGES TABLE ===');

    // Add title column (use subject as default)
    console.log('1. Adding title column...');
    const checkTitle = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'title'
    `);

    if (checkTitle.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE messages ADD title NVARCHAR(500)
      `);
      // Copy subject to title
      await pool.request().query(`
        UPDATE messages SET title = subject WHERE title IS NULL
      `);
      console.log('   ✓ Added title column and copied from subject');
    } else {
      console.log('   - title column already exists');
    }

    // Add status column
    console.log('2. Adding status column...');
    const checkStatus = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'status'
    `);

    if (checkStatus.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE messages ADD status NVARCHAR(20) DEFAULT 'sent'
      `);
      // Set status based on sent_at
      await pool.request().query(`
        UPDATE messages SET status = CASE WHEN sent_at IS NOT NULL THEN 'sent' ELSE 'draft' END
      `);
      console.log('   ✓ Added status column');
    } else {
      console.log('   - status column already exists');
    }

    // Rename sender_id to created_by
    console.log('3. Checking created_by column...');
    const checkCreatedBy = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'created_by'
    `);

    if (checkCreatedBy.recordset.length === 0) {
      const checkSenderId = await pool.request().query(`
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'sender_id'
      `);

      if (checkSenderId.recordset.length > 0) {
        await pool.request().query(`
          EXEC sp_rename 'messages.sender_id', 'created_by', 'COLUMN'
        `);
        console.log('   ✓ Renamed sender_id to created_by');
      }
    } else {
      console.log('   - created_by column already exists');
    }

    console.log('\n✓ Comprehensive migration completed successfully!');
    console.log('\nPlease restart the backend server.');

  } catch(err) {
    console.error('\n✗ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runComprehensiveMigration();
