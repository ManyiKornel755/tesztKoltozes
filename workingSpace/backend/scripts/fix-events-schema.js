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

async function fixEventsSchema() {
  let pool;

  try {
    console.log('Csatlakozás az adatbázishoz...\n');
    pool = await sql.connect(config);
    console.log('✓ Sikeres csatlakozás!\n');

    // ============================================
    // EVENTS TÁBLA JAVÍTÁSA
    // ============================================
    console.log('=== EVENTS TÁBLA ===');

    // 1. Rename organizer_id to created_by
    console.log('1. created_by oszlop ellenőrzése...');
    const checkCreatedBy = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'created_by'
    `);

    if (checkCreatedBy.recordset.length === 0) {
      const checkOrganizerId = await pool.request().query(`
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'organizer_id'
      `);

      if (checkOrganizerId.recordset.length > 0) {
        await pool.request().query(`
          EXEC sp_rename 'events.organizer_id', 'created_by', 'COLUMN'
        `);
        console.log('   ✓ organizer_id átnevezve created_by-ra');
      } else {
        // Add created_by if neither exists
        await pool.request().query(`
          ALTER TABLE events ADD created_by INT NULL
        `);
        console.log('   ✓ created_by oszlop hozzáadva');
      }
    } else {
      console.log('   - created_by oszlop már létezik');
    }

    // 2. Add event_type column
    console.log('2. event_type oszlop hozzáadása...');
    const checkEventType = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'event_type'
    `);

    if (checkEventType.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE events ADD event_type NVARCHAR(50) NULL
      `);
      console.log('   ✓ event_type oszlop hozzáadva');
    } else {
      console.log('   - event_type oszlop már létezik');
    }

    // 3. Add target_group_id column
    console.log('3. target_group_id oszlop hozzáadása...');
    const checkTargetGroupId = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'events' AND COLUMN_NAME = 'target_group_id'
    `);

    if (checkTargetGroupId.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE events ADD target_group_id INT NULL
      `);
      console.log('   ✓ target_group_id oszlop hozzáadva');
    } else {
      console.log('   - target_group_id oszlop már létezik');
    }

    console.log('\n✓ Events tábla javítva!');
    console.log('\nKérlek indítsd újra a backend szervert.');

  } catch(err) {
    console.error('\n✗ Migráció sikertelen:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

fixEventsSchema();
