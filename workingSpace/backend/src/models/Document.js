const { pool } = require('../config/database');

class Document {
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM documents ORDER BY created_at DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM documents WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ title, description, file_path, category, uploaded_by = null }) {
    const [result] = await pool.query(
      'INSERT INTO documents (title, description, file_path, category, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, file_path, category || null, uploaded_by]
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
      `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM documents WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Document;
