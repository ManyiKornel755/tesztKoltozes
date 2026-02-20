const { pool } = require('../config/database');

class User {
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async create({ email, password_hash, first_name, last_name, phone = null, is_member = false }) {
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, is_member) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, first_name, last_name, phone, is_member]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  }

  static async getAllWithRoles() {
    const [rows] = await pool.query(`
      SELECT 
        u.*,
        GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return rows.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : []
    }));
  }

  static async assignRole(userId, roleId) {
    const [result] = await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id',
      [userId, roleId]
    );
    return result.affectedRows > 0;
  }

  static async removeRole(userId, roleId) {
    const [result] = await pool.query(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, roleId]
    );
    return result.affectedRows > 0;
  }

  static async getRoles(userId) {
    const [rows] = await pool.query(
      'SELECT r.* FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?',
      [userId]
    );
    return rows;
  }
}

module.exports = User;
