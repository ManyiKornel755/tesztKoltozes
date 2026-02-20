const { pool } = require('../config/database');

class Member {
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE is_member = 1 ORDER BY created_at DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND is_member = 1',
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { email, password_hash, first_name, last_name, phone } = data;
    
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, is_member) VALUES (?, ?, ?, ?, ?, 1)',
      [email, password_hash, first_name, last_name, phone || null]
    );
    
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND is_member = 1`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ? AND is_member = 1',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async addTag(userId, tagId) {
    const [result] = await pool.query(
      'INSERT INTO user_tags (user_id, tag_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id',
      [userId, tagId]
    );
    return result.affectedRows > 0;
  }

  static async removeTag(userId, tagId) {
    const [result] = await pool.query(
      'DELETE FROM user_tags WHERE user_id = ? AND tag_id = ?',
      [userId, tagId]
    );
    return result.affectedRows > 0;
  }

  static async getTags(userId) {
    const [rows] = await pool.query(
      'SELECT t.* FROM tags t INNER JOIN user_tags ut ON t.id = ut.tag_id WHERE ut.user_id = ?',
      [userId]
    );
    return rows;
  }
}

module.exports = Member;
