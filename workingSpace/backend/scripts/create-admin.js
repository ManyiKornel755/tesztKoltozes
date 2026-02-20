const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

const createAdmin = async () => {
  try {
    console.log('Creating admin user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@bmfvse.hu']
    );

    let userId;

    if (existingUsers.length > 0) {
      console.log('Admin user already exists. Updating password...');
      userId = existingUsers[0].id;

      await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
    } else {
      console.log('Creating new admin user...');

      // Create admin user
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, phone, address, membership_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Admin', 'admin@bmfvse.hu', hashedPassword, null, null, 'active']
      );

      userId = result.insertId;
    }

    // Check if admin role exists
    let [adminRoles] = await pool.query(
      'SELECT * FROM roles WHERE name = ?',
      ['admin']
    );

    let adminRoleId;

    if (adminRoles.length === 0) {
      console.log('Creating admin role...');
      const [roleResult] = await pool.query(
        'INSERT INTO roles (name, description) VALUES (?, ?)',
        ['admin', 'Administrator with full access']
      );
      adminRoleId = roleResult.insertId;
    } else {
      adminRoleId = adminRoles[0].id;
    }

    // Check if user already has admin role
    const [existingRoles] = await pool.query(
      'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, adminRoleId]
    );

    if (existingRoles.length === 0) {
      console.log('Assigning admin role to user...');
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, adminRoleId]
      );
    } else {
      console.log('User already has admin role.');
    }

    console.log('Admin user created successfully!');
    console.log('Email: admin@bmfvse.hu');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
