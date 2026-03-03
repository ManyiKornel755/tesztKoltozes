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

async function checkEvents() {
  try {
    await sql.connect(config);

    console.log('=== Events Table Columns ===');
    const cols = await sql.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'events'
    `);
    cols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME}`));

    console.log('\n=== Groups Table Columns ===');
    const groupCols = await sql.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'groups'
    `);
    groupCols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME}`));

  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    sql.close();
  }
}

checkEvents();
