const sql = require('mssql');
const fs = require('fs');
const path = require('path');
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

async function runMigration() {
  let pool;

  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected successfully!\n');

    // Add address column to users table
    console.log('1. Checking users table for address column...');
    const checkAddress = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'address'
    `);

    if (checkAddress.recordset.length === 0) {
      await pool.request().query('ALTER TABLE users ADD address NVARCHAR(500) NULL');
      console.log('   ✓ Added address column to users table');
    } else {
      console.log('   - address column already exists');
    }

    // Add is_deleted column to groups table
    console.log('\n2. Checking groups table for is_deleted column...');
    const checkDeleted = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'groups' AND COLUMN_NAME = 'is_deleted'
    `);

    if (checkDeleted.recordset.length === 0) {
      await pool.request().query('ALTER TABLE groups ADD is_deleted BIT DEFAULT 0');
      console.log('   ✓ Added is_deleted column to groups table');
    } else {
      console.log('   - is_deleted column already exists');
    }

    // Add created_at column to messages table
    console.log('\n3. Checking messages table for created_at column...');
    const checkCreatedAt = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'created_at'
    `);

    if (checkCreatedAt.recordset.length === 0) {
      await pool.request().query('ALTER TABLE messages ADD created_at DATETIME2 DEFAULT GETDATE()');
      console.log('   ✓ Added created_at column to messages table');
    } else {
      console.log('   - created_at column already exists');
    }

    console.log('\n✓ Migration completed successfully!');

  } catch(err) {
    console.error('\n✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runMigration();
