// Import: const { pool } = require('../config/database')
// KRITIKUS: NEM const db = require(...)!
const { pool } = require('../config/database');

class UserDocument {
  // Get all documents for a user
  static async getByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT ud.*, u.name as user_name, u.email as user_email,
              g.name as generated_by_name, g.email as generated_by_email
       FROM user_documents ud
       LEFT JOIN users u ON ud.user_id = u.id
       LEFT JOIN users g ON ud.generated_by = g.id
       WHERE ud.user_id = ?
       ORDER BY ud.created_at DESC`,
      [userId]
    );
    return rows;
  }

  // Find document by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ud.*, u.name as user_name, u.email as user_email,
              g.name as generated_by_name, g.email as generated_by_email
       FROM user_documents ud
       LEFT JOIN users u ON ud.user_id = u.id
       LEFT JOIN users g ON ud.generated_by = g.id
       WHERE ud.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Create new user document
  static async create({ user_id, document_type, file_path, generated_by }) {
    const [result] = await pool.query(
      `INSERT INTO user_documents (user_id, document_type, file_path, generated_by)
       VALUES (?, ?, ?, ?)`,
      [user_id, document_type, file_path, generated_by]
    );
    return this.findById(result.insertId);
  }

  // Delete user document
  static async delete(id) {
    // Get the file path before deleting
    const document = await this.findById(id);

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from database
    const [result] = await pool.query('DELETE FROM user_documents WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('Document not found');
    }

    return {
      message: 'Document deleted successfully',
      file_path: document.file_path
    };
  }

  // Get all documents
  static async getAll() {
    const [rows] = await pool.query(
      `SELECT ud.*, u.name as user_name, u.email as user_email,
              g.name as generated_by_name, g.email as generated_by_email
       FROM user_documents ud
       LEFT JOIN users u ON ud.user_id = u.id
       LEFT JOIN users g ON ud.generated_by = g.id
       ORDER BY ud.created_at DESC`
    );
    return rows;
  }

  // Get documents by type
  static async getByType(documentType) {
    const [rows] = await pool.query(
      `SELECT ud.*, u.name as user_name, u.email as user_email,
              g.name as generated_by_name, g.email as generated_by_email
       FROM user_documents ud
       LEFT JOIN users u ON ud.user_id = u.id
       LEFT JOIN users g ON ud.generated_by = g.id
       WHERE ud.document_type = ?
       ORDER BY ud.created_at DESC`,
      [documentType]
    );
    return rows;
  }
}

module.exports = UserDocument;
