const sql = require('mssql');
const { poolPromise } = require('../config/database');

class Certificate {
  static async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT c.*,
               u.name as user_name,
               u.email as user_email
        FROM certificates c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
      `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT * FROM certificates
          WHERE user_id = @userId
          ORDER BY created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM certificates WHERE id = @id');
      return result.recordset[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async create({ user_id, title, content, issue_date, valid_until }) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('user_id', sql.Int, user_id)
        .input('title', sql.NVarChar, title)
        .input('content', sql.NVarChar, content)
        .input('issue_date', sql.Date, issue_date)
        .input('valid_until', sql.Date, valid_until || null)
        .query(`
          INSERT INTO certificates (user_id, title, content, issue_date, valid_until)
          OUTPUT INSERTED.*
          VALUES (@user_id, @title, @content, @issue_date, @valid_until)
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, { title, content, issue_date, valid_until }) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('title', sql.NVarChar, title)
        .input('content', sql.NVarChar, content)
        .input('issue_date', sql.Date, issue_date)
        .input('valid_until', sql.Date, valid_until || null)
        .query(`
          UPDATE certificates
          SET title = @title,
              content = @content,
              issue_date = @issue_date,
              valid_until = @valid_until,
              updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
      return result.recordset[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM certificates WHERE id = @id');
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Certificate;
