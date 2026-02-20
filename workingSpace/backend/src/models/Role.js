// Import: const { pool } = require('../config/database')
const { pool } = require('../config/database');

class Role {
  // Get all roles
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY name');
    return rows;
  }

  // Find role by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    return rows[0];
  }

  // Create new role
  static async create({ name, description }) {
    const [result] = await pool.query(
      'INSERT INTO roles (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    return { id: result.insertId, name, description };
  }

  // Update role
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('Role not found');
    }

    return this.findById(id);
  }

  // Delete role
  static async delete(id) {
    // First, remove all user_roles associations
    await pool.query('DELETE FROM user_roles WHERE role_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('Role not found');
    }

    return { message: 'Role deleted successfully' };
  }

  // Assign role to user
  static async assignToUser(userId, roleId) {
    const [result] = await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleId]
    );
    return { userId, roleId };
  }

  // Remove role from user
  static async removeFromUser(userId, roleId) {
    const [result] = await pool.query(
      'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, roleId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Role assignment not found');
    }

    return { message: 'Role removed from user successfully' };
  }

  // Get all roles for a user
  static async getUserRoles(userId) {
    const [rows] = await pool.query(
      `SELECT r.*
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?
       ORDER BY r.name`,
      [userId]
    );
    return rows;
  }
}

module.exports = Role;
