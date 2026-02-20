import React, { useState, useEffect } from 'react';
import { users } from '../services/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    membership_status: 'inactive'
  });

  useEffect(() => {
    fetchMembers();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, statusFilter, members]);

  const checkAdminStatus = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.roles?.includes('admin') || false);
  };

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await users.getAll();
      setMembers(response.data);
      setFilteredMembers(response.data);
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((member) => member.membership_status === statusFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      membership_status: 'inactive'
    });
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      phone: member.phone || '',
      address: member.address || '',
      membership_status: member.membership_status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingMember) {
        // Update existing member
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await users.update(editingMember.id, updateData);
      } else {
        // Create new member
        await users.create(formData);
      }

      setShowModal(false);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save member');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await users.delete(memberId);
      fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete member');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading members...</div>;
  }

  return (
    <div className="members-page">
      <h1>Members Management</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        {isAdmin && (
          <button onClick={openAddModal} className="btn-primary">
            Add Member
          </button>
        )}
      </div>

      <table className="members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Roles</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.phone || '-'}</td>
              <td>
                <span className={`status-badge status-${member.membership_status}`}>
                  {member.membership_status}
                </span>
              </td>
              <td>{member.roles || '-'}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => openEditModal(member)} className="btn-small">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="btn-small btn-danger">
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {filteredMembers.length === 0 && <p className="no-results">No members found.</p>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMember ? 'Edit Member' : 'Add New Member'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!editingMember && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingMember}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Membership Status</label>
                <select
                  name="membership_status"
                  value={formData.membership_status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingMember ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
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

export default Members;
