const bcrypt = require('bcryptjs');
const { poolPromise } = require('../src/config/database');

const createAdmin = async () => {
  try {
    console.log('Creating admin user...');
    const pool = await poolPromise;

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin user already exists
    const existingUsers = await pool.request()
      .input('email', 'admin@bmfvse.hu')
      .query('SELECT * FROM users WHERE email = @email');

    let userId;

    if (existingUsers.recordset.length > 0) {
      console.log('Admin user already exists. Updating password...');
      userId = existingUsers.recordset[0].id;

      await pool.request()
        .input('password', hashedPassword)
        .input('id', userId)
        .query('UPDATE users SET password = @password WHERE id = @id');
    } else {
      console.log('Creating new admin user...');

      // Create admin user
      const result = await pool.request()
        .input('name', 'Admin User')
        .input('email', 'admin@bmfvse.hu')
        .input('password', hashedPassword)
        .input('is_member', 1)
        .query(`INSERT INTO users (name, email, password, is_member)
                OUTPUT INSERTED.id
                VALUES (@name, @email, @password, @is_member)`);

      userId = result.recordset[0].id;
    }

    // Check if admin role exists
    const adminRoles = await pool.request()
      .input('name', 'admin')
      .query('SELECT * FROM roles WHERE name = @name');

    let adminRoleId;

    if (adminRoles.recordset.length === 0) {
      console.log('Creating admin role...');
      const roleResult = await pool.request()
        .input('name', 'admin')
        .input('description', 'Administrator with full access')
        .query('INSERT INTO roles (name, description) OUTPUT INSERTED.id VALUES (@name, @description)');
      adminRoleId = roleResult.recordset[0].id;
    } else {
      adminRoleId = adminRoles.recordset[0].id;
    }

    // Check if user already has admin role
    const existingRoles = await pool.request()
      .input('user_id', userId)
      .input('role_id', adminRoleId)
      .query('SELECT * FROM user_roles WHERE user_id = @user_id AND role_id = @role_id');

    if (existingRoles.recordset.length === 0) {
      console.log('Assigning admin role to user...');
      await pool.request()
        .input('user_id', userId)
        .input('role_id', adminRoleId)
        .query('INSERT INTO user_roles (user_id, role_id) VALUES (@user_id, @role_id)');
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
