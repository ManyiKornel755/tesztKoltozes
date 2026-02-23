const { pool } = require('../config/database');

class Group {
  // Get all non-deleted groups
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM groups WHERE is_deleted = FALSE ORDER BY name'
    );
    return rows;
  }

  // Find group by ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM groups WHERE id = ? AND is_deleted = FALSE',
      [id]
    );
    return rows[0];
  }

  // Create new group
  static async create({ name, created_by }) {
    const [result] = await pool.query(
      'INSERT INTO groups (name, created_by) VALUES (?, ?)',
      [name, created_by]
    );
    return { id: result.insertId, name, created_by };
  }

  // Update group
  static async update(id, { name }) {
    const [result] = await pool.query(
      'UPDATE groups SET name = ? WHERE id = ? AND is_deleted = FALSE',
      [name, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Group not found');
    }

    return this.findById(id);
  }

  // Soft delete group
  static async delete(id) {
    const [result] = await pool.query(
      'UPDATE groups SET is_deleted = TRUE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Group not found');
    }

    return { message: 'Group deleted successfully' };
  }

  // Get all members of a group
  static async getMembers(groupId) {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, gm.added_at
       FROM users u
       INNER JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = ?
       ORDER BY u.last_name, u.first_name`,
      [groupId]
    );
    return rows;
  }

  // Add a member to group
  static async addMember(groupId, userId) {
    try {
      const [result] = await pool.query(
        'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
        [groupId, userId]
      );
      return { groupId, userId };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('User is already a member of this group');
      }
      throw error;
    }
  }

  // Remove a member from group
  static async removeMember(groupId, userId) {
    const [result] = await pool.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Member not found in group');
    }

    return { message: 'Member removed successfully' };
  }

  // Add multiple members to group (bulk insert)
  static async addMembers(groupId, userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('userIds must be a non-empty array');
    }

    const values = userIds.map(userId => [groupId, userId]);

    try {
      const [result] = await pool.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ?',
        [values]
      );
      return { groupId, addedCount: result.affectedRows };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('One or more users are already members of this group');
      }
      throw error;
    }
  }

  // Get group with member count
  static async getAllWithMemberCount() {
    const [rows] = await pool.query(
      `SELECT g.*, COUNT(gm.user_id) as member_count
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.is_deleted = FALSE
       GROUP BY g.id
       ORDER BY g.name`
    );
    return rows;
  }
}

module.exports = Group;
