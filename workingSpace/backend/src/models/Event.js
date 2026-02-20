const { pool } = require('../config/database');

class Event {
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM events ORDER BY event_date DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ title, description, event_date, location, event_type, created_by = null }) {
    const [result] = await pool.query(
      'INSERT INTO events (title, description, event_date, location, event_type, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, event_date, location || null, event_type || null, created_by]
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
      `UPDATE events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM events WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async addParticipant(eventId, userId, status = 'pending') {
    const [result] = await pool.query(
      'INSERT INTO event_participants (event_id, user_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)',
      [eventId, userId, status]
    );
    return result.affectedRows > 0;
  }

  static async removeParticipant(eventId, userId) {
    const [result] = await pool.query(
      'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );
    return result.affectedRows > 0;
  }

  static async getParticipants(eventId) {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        ep.status,
        ep.registered_at
      FROM event_participants ep
      INNER JOIN users u ON ep.user_id = u.id
      WHERE ep.event_id = ?
      ORDER BY ep.registered_at DESC
    `, [eventId]);
    return rows;
  }
}

module.exports = Event;
