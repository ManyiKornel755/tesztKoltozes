const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

const resetAdminPassword = async () => {
  try {
    console.log('Resetting admin password...');

    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Find admin user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@bmfvse.hu']
    );

    if (users.length === 0) {
      console.error('Admin user not found!');
      console.log('Please run create-admin.js first.');
      process.exit(1);
    }

    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@bmfvse.hu']
    );

    console.log('Admin password reset successfully!');
    console.log('Email: admin@bmfvse.hu');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
};

resetAdminPassword();
