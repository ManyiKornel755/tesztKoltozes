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

async function checkDatabase() {
  try {
    await sql.connect(config);

    // Check tables
    const tables = await sql.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    console.log('\n=== Existing Tables ===');
    tables.recordset.forEach(t => console.log(`- ${t.TABLE_NAME}`));

    // Check users columns
    console.log('\n=== Users Table Columns ===');
    const usersCols = await sql.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
    `);
    usersCols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME}`));

    // Check messages columns
    console.log('\n=== Messages Table Columns ===');
    const msgCols = await sql.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages'
    `);
    if (msgCols.recordset.length > 0) {
      msgCols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME}`));
    } else {
      console.log('Table does not exist');
    }

    // Check groups columns
    console.log('\n=== Groups Table Columns ===');
    const groupsCols = await sql.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'groups'
    `);
    if (groupsCols.recordset.length > 0) {
      groupsCols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME}`));
    } else {
      console.log('Table does not exist');
    }

  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    sql.close();
  }
}

checkDatabase();
