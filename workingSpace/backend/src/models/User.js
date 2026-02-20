// Import: const { pool } = require('../config/database')
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Get all users with their roles
  static async getAllWithRoles() {
    const [users] = await pool.query(`
      SELECT u.*,
             GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.name
    `);
    return users;
  }

  // Get all users
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY name');
    return rows;
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  // Create new user
  static async create({ name, email, password, phone, address, membership_status }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, address, membership_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, address || null, membership_status || 'inactive']
    );

    return this.findById(result.insertId);
  }

  // Update user
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }

    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address);
    }

    if (data.membership_status !== undefined) {
      fields.push('membership_status = ?');
      values.push(data.membership_status);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }

    return this.findById(id);
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }

    return { message: 'Password updated successfully' };
  }

  // Delete user
  static async delete(id) {
    // Delete related records first
    await pool.query('DELETE FROM user_roles WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM event_participants WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM message_recipients WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM transactions WHERE user_id = ?', [id]);
    await pool.query('DELETE FROM user_documents WHERE user_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
