const { pool } = require('../config/database');

class RaceReport {
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM race_reports ORDER BY race_date DESC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM race_reports WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ race_name, race_date, location, status = 'draft', created_by = null }) {
    const [result] = await pool.query(
      'INSERT INTO race_reports (race_name, race_date, location, status, created_by) VALUES (?, ?, ?, ?, ?)',
      [race_name, race_date, location || null, status, created_by]
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
      `UPDATE race_reports SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM race_reports WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getParticipants(raceReportId) {
    const [rows] = await pool.query(`
      SELECT 
        rp.*,
        u.email,
        u.first_name,
        u.last_name
      FROM race_participants rp
      LEFT JOIN users u ON rp.user_id = u.id
      WHERE rp.race_report_id = ?
      ORDER BY rp.position IS NULL, rp.position ASC, rp.created_at DESC
    `, [raceReportId]);
    return rows;
  }

  static async addParticipant(raceReportId, data) {
    const { user_id, name, sail_number, boat_class, position, notes } = data;
    
    const [result] = await pool.query(
      'INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        raceReportId, 
        user_id || null, 
        name, 
        sail_number || null, 
        boat_class || null, 
        position || null, 
        notes || null
      ]
    );
    
    return { id: result.insertId };
  }

  static async addParticipantsBulk(raceReportId, participants) {
    if (!participants || participants.length === 0) {
      return { inserted: 0 };
    }

    const values = [];
    const placeholders = [];

    participants.forEach(p => {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
      values.push(
        raceReportId,
        p.user_id || null,
        p.name,
        p.sail_number || null,
        p.boat_class || null,
        p.position || null,
        p.notes || null
      );
    });

    const [result] = await pool.query(
      `INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position, notes) VALUES ${placeholders.join(', ')}`,
      values
    );

    return { inserted: result.affectedRows };
  }

  static async updateParticipant(participantId, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(data[key] === '' ? null : data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(participantId);

    const [result] = await pool.query(
      `UPDATE race_participants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async removeParticipant(participantId) {
    const [result] = await pool.query(
      'DELETE FROM race_participants WHERE id = ?',
      [participantId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = RaceReport;
