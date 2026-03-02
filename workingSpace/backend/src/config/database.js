const sql = require('mssql');
require('dotenv').config();

// SQL Server configuration
const config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'WaveAlertDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ SQL Server connected successfully');
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL Server connection failed:', err.message);
    throw err;
  });

// Export both pool promise and sql for queries
module.exports = {
  sql,
  poolPromise,
  config
};
