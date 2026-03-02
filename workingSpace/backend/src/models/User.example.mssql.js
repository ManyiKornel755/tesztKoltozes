const { sql, poolPromise } = require('../config/database');

class User {
  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM users WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async findByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM users WHERE email = @email');
    return result.recordset[0] || null;
  }

  static async create({ email, password_hash, first_name, last_name, phone = null, is_member = false }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, password_hash)
      .input('first_name', sql.NVarChar, first_name)
      .input('last_name', sql.NVarChar, last_name)
      .input('phone', sql.VarChar, phone)
      .input('is_member', sql.Bit, is_member)
      .query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, is_member)
        OUTPUT INSERTED.*
        VALUES (@email, @password_hash, @first_name, @last_name, @phone, @is_member)
      `);
    return result.recordset[0];
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request();

    const fields = [];
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        // Típus meghatározás az érték alapján
        const sqlType = typeof data[key] === 'number' ? sql.Int :
                       typeof data[key] === 'boolean' ? sql.Bit : sql.NVarChar;
        request.input(key, sqlType, data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    request.input('id', sql.Int, id);

    await request.query(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = @id
    `);

    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM users WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM users ORDER BY created_at DESC');
    return result.recordset;
  }

  static async getAllWithRoles() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        u.*,
        STRING_AGG(r.name, ',') as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.email, u.password_hash, u.first_name, u.last_name,
               u.phone, u.is_member, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `);

    return result.recordset.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : []
    }));
  }

  static async assignRole(userId, roleId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = @userId AND role_id = @roleId)
        BEGIN
          INSERT INTO user_roles (user_id, role_id) VALUES (@userId, @roleId)
        END
      `);
    return result.rowsAffected[0] > 0;
  }

  static async removeRole(userId, roleId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('DELETE FROM user_roles WHERE user_id = @userId AND role_id = @roleId');
    return result.rowsAffected[0] > 0;
  }

  static async getRoles(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.*
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = @userId
      `);
    return result.recordset;
  }
}

module.exports = User;
