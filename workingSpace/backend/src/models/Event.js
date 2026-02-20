// Import: const { pool } = require('../config/database')
const { pool } = require('../config/database');

class Event {
  // Get all events
  static async getAll() {
    const [rows] = await pool.query(
      `SELECT e.*, u.name as created_by_name, u.email as created_by_email
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.event_date DESC`
    );
    return rows;
  }

  // Find event by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, u.name as created_by_name, u.email as created_by_email
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Create new event
  static async create({ title, description, event_date, location, max_participants, created_by }) {
    const [result] = await pool.query(
      `INSERT INTO events (title, description, event_date, location, max_participants, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || null, event_date, location || null, max_participants || null, created_by]
    );
    return this.findById(result.insertId);
  }

  // Update event
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }

    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (data.event_date !== undefined) {
      fields.push('event_date = ?');
      values.push(data.event_date);
    }

    if (data.location !== undefined) {
      fields.push('location = ?');
      values.push(data.location);
    }

    if (data.max_participants !== undefined) {
      fields.push('max_participants = ?');
      values.push(data.max_participants);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('Event not found');
    }

    return this.findById(id);
  }

  // Delete event
  static async delete(id) {
    // Delete all participants first
    await pool.query('DELETE FROM event_participants WHERE event_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('Event not found');
    }

    return { message: 'Event deleted successfully' };
  }

  // Add participant to event
  static async addParticipant(eventId, userId) {
    // Check if event exists and get max_participants
    const event = await this.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check current participant count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?',
      [eventId]
    );

    if (event.max_participants && countResult[0].count >= event.max_participants) {
      throw new Error('Event is full');
    }

    // Add participant
    await pool.query(
      'INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)',
      [eventId, userId]
    );

    return { message: 'Participant added successfully' };
  }

  // Remove participant from event
  static async removeParticipant(eventId, userId) {
    const [result] = await pool.query(
      'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Participant not found');
    }

    return { message: 'Participant removed successfully' };
  }

  // Get all participants for an event
  static async getParticipants(eventId) {
    const [rows] = await pool.query(
      `SELECT u.*, ep.registered_at
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = ?
       ORDER BY ep.registered_at`,
      [eventId]
    );
    return rows;
  }
}

module.exports = Event;
