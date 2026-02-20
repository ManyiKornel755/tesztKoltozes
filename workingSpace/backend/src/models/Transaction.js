// Import: const { pool } = require('../config/database')
const { pool } = require('../config/database');

class Transaction {
  // Get all transactions with optional filters
  static async getAll(filters = {}) {
    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND t.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.transaction_type) {
      query += ' AND t.transaction_type = ?';
      params.push(filters.transaction_type);
    }

    if (filters.category) {
      query += ' AND t.category = ?';
      params.push(filters.category);
    }

    if (filters.start_date) {
      query += ' AND t.transaction_date >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND t.transaction_date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Find transaction by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Create new transaction
  static async create({ user_id, amount, transaction_type, category, description }) {
    const [result] = await pool.query(
      `INSERT INTO transactions (user_id, amount, transaction_type, category, description, transaction_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [user_id, amount, transaction_type, category, description || null]
    );
    return this.findById(result.insertId);
  }

  // Update transaction
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.user_id !== undefined) {
      fields.push('user_id = ?');
      values.push(data.user_id);
    }

    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }

    if (data.transaction_type !== undefined) {
      fields.push('transaction_type = ?');
      values.push(data.transaction_type);
    }

    if (data.category !== undefined) {
      fields.push('category = ?');
      values.push(data.category);
    }

    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (data.transaction_date !== undefined) {
      fields.push('transaction_date = ?');
      values.push(data.transaction_date);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('Transaction not found');
    }

    return this.findById(id);
  }

  // Delete transaction
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM transactions WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('Transaction not found');
    }

    return { message: 'Transaction deleted successfully' };
  }

  // Get statistics (income and expenses summary)
  static async getStats() {
    const [rows] = await pool.query(`
      SELECT
        transaction_type,
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MIN(amount) as minimum,
        MAX(amount) as maximum
      FROM transactions
      GROUP BY transaction_type, category
      ORDER BY transaction_type, category
    `);

    // Calculate overall totals
    const [totals] = await pool.query(`
      SELECT
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
      FROM transactions
    `);

    return {
      by_category: rows,
      totals: {
        total_income: totals[0].total_income || 0,
        total_expense: totals[0].total_expense || 0,
        balance: (totals[0].total_income || 0) - (totals[0].total_expense || 0),
        income_count: totals[0].income_count,
        expense_count: totals[0].expense_count
      }
    };
  }
}

module.exports = Transaction;
