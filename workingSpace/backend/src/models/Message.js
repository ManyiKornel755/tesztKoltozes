// Import: const { pool } = require('../config/database')
const { pool } = require('../config/database');

class Message {
  // Get all messages
  static async getAll() {
    const [rows] = await pool.query(
      `SELECT m.*, u.name as created_by_name, u.email as created_by_email
       FROM messages m
       LEFT JOIN users u ON m.created_by_user_id = u.id
       ORDER BY m.created_at DESC`
    );
    return rows;
  }

  // Find message by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT m.*, u.name as created_by_name, u.email as created_by_email
       FROM messages m
       LEFT JOIN users u ON m.created_by_user_id = u.id
       WHERE m.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Create new message
  static async create({ subject, body, created_by_user_id }) {
    const [result] = await pool.query(
      'INSERT INTO messages (subject, body, created_by_user_id, status) VALUES (?, ?, ?, ?)',
      [subject, body, created_by_user_id, 'draft']
    );
    return this.findById(result.insertId);
  }

  // Update message
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.subject !== undefined) {
      fields.push('subject = ?');
      values.push(data.subject);
    }

    if (data.body !== undefined) {
      fields.push('body = ?');
      values.push(data.body);
    }

    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE messages SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('Message not found');
    }

    return this.findById(id);
  }

  // Delete message
  static async delete(id) {
    // First, delete all recipients
    await pool.query('DELETE FROM message_recipients WHERE message_id = ?', [id]);

    const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('Message not found');
    }

    return { message: 'Message deleted successfully' };
  }

  // Send message (update status and set sent_at)
  // KRITIKUS: LEFT JOIN users (NEM members!)
  static async send(messageId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update message status
      await connection.query(
        'UPDATE messages SET status = ?, sent_at = NOW() WHERE id = ?',
        ['sent', messageId]
      );

      // Get all recipients with user data
      const [recipients] = await connection.query(
        `SELECT mr.*, u.name, u.email
         FROM message_recipients mr
         LEFT JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = ?`,
        [messageId]
      );

      await connection.commit();
      return recipients;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get recipients for a message
  // KRITIKUS: LEFT JOIN users u ON mr.user_id = u.id
  static async getRecipients(messageId) {
    const [rows] = await pool.query(
      `SELECT mr.*, u.name, u.email, u.id as user_id
       FROM message_recipients mr
       LEFT JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = ?`,
      [messageId]
    );
    return rows;
  }

  // Add recipients to a message
  static async addRecipients(messageId, userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs must be a non-empty array');
    }

    const values = userIds.map(userId => [messageId, userId]);

    await pool.query(
      'INSERT INTO message_recipients (message_id, user_id) VALUES ?',
      [values]
    );

    return this.getRecipients(messageId);
  }

  // Remove recipient from a message
  static async removeRecipient(messageId, userId) {
    const [result] = await pool.query(
      'DELETE FROM message_recipients WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Recipient not found');
    }

    return { message: 'Recipient removed successfully' };
  }
}

module.exports = Message;
