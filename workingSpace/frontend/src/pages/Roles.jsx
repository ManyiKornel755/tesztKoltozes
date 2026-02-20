import React, { useState, useEffect } from 'react';
import { roles, users } from '../services/api';

const Roles = () => {
  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Form state for role
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await roles.getAll();
      setRolesList(response.data);
    } catch (err) {
      setError('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await users.getAll();
      setUsersList(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const fetchUserRoles = async (userId) => {
    try {
      const response = await roles.getUserRoles(userId);
      setUserRoles(response.data);
    } catch (err) {
      setError('Failed to load user roles');
    }
  };

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    if (userId) {
      const user = usersList.find((u) => u.id === parseInt(userId));
      setSelectedUser(user);
      fetchUserRoles(userId);
    } else {
      setSelectedUser(null);
      setUserRoles([]);
    }
  };

  const handleAssignRole = async (roleId) => {
    if (!selectedUser) return;

    try {
      await roles.assignToUser(roleId, selectedUser.id);
      fetchUserRoles(selectedUser.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!selectedUser) return;

    if (!window.confirm('Are you sure you want to remove this role from the user?')) {
      return;
    }

    try {
      await roles.removeFromUser(roleId, selectedUser.id);
      fetchUserRoles(selectedUser.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove role');
    }
  };

  const openAddRoleModal = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      description: ''
    });
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || ''
    });
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingRole) {
        await roles.update(editingRole.id, roleFormData);
      } else {
        await roles.create(roleFormData);
      }

      setShowRoleModal(false);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? This will remove it from all users.')) {
      return;
    }

    try {
      await roles.delete(roleId);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete role');
    }
  };

  const hasRole = (roleId) => {
    return userRoles.some((r) => r.id === roleId);
  };

  if (isLoading) {
    return <div className="loading">Loading roles...</div>;
  }

  return (
    <div className="roles-page">
      <h1>Roles Management</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="roles-container">
        {/* Roles List Section */}
        <div className="roles-section">
          <div className="section-header">
            <h2>Roles</h2>
            <button onClick={openAddRoleModal} className="btn-primary">
              Add Role
            </button>
          </div>

          <table className="roles-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rolesList.map((role) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>{role.description || '-'}</td>
                  <td>
                    <button onClick={() => openEditRoleModal(role)} className="btn-small">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteRole(role.id)} className="btn-small btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Role Assignment Section */}
        <div className="user-roles-section">
          <h2>Assign Roles to User</h2>

          <div className="form-group">
            <label>Select User</label>
            <select onChange={handleUserSelect} className="user-select">
              <option value="">-- Select a user --</option>
              {usersList.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div className="user-roles-management">
              <h3>
                Roles for {selectedUser.name}
              </h3>

              <div className="current-roles">
                <h4>Current Roles:</h4>
                {userRoles.length > 0 ? (
                  <ul className="roles-list">
                    {userRoles.map((role) => (
                      <li key={role.id}>
                        <span>{role.name}</span>
                        <button
                          onClick={() => handleRemoveRole(role.id)}
                          className="btn-small btn-danger"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No roles assigned</p>
                )}
              </div>

              <div className="available-roles">
                <h4>Available Roles:</h4>
                <ul className="roles-list">
                  {rolesList
                    .filter((role) => !hasRole(role.id))
                    .map((role) => (
                      <li key={role.id}>
                        <span>
                          {role.name}
                          {role.description && ` - ${role.description}`}
                        </span>
                        <button
                          onClick={() => handleAssignRole(role.id)}
                          className="btn-small btn-primary"
                        >
                          Assign
                        </button>
                      </li>
                    ))}
                </ul>
                {rolesList.filter((role) => !hasRole(role.id)).length === 0 && (
                  <p>All roles are already assigned</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
            <form onSubmit={handleRoleSubmit}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowRoleModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
