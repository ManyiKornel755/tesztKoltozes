import React, { useState, useEffect } from 'react';
import { messages, users } from '../services/api';

const Messages = () => {
  const [messagesList, setMessagesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchMessages();
    fetchUsers();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.roles?.includes('admin') || false);
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await messages.getAll();
      setMessagesList(response.data);
    } catch (err) {
      setError('Failed to load messages');
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

  const openCreateModal = () => {
    setEditingMessage(null);
    setFormData({
      subject: '',
      body: ''
    });
    setSelectedRecipients([]);
    setShowModal(true);
  };

  const openEditModal = async (message) => {
    try {
      const response = await messages.getById(message.id);
      setEditingMessage(response.data);
      setFormData({
        subject: response.data.subject,
        body: response.data.body
      });
      setSelectedRecipients(response.data.recipients?.map(r => r.user_id) || []);
      setShowModal(true);
    } catch (err) {
      setError('Failed to load message details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let messageId;

      if (editingMessage) {
        // Update existing message
        await messages.update(editingMessage.id, formData);
        messageId = editingMessage.id;
      } else {
        // Create new message
        const response = await messages.create(formData);
        messageId = response.data.id;
      }

      // Update recipients
      if (selectedRecipients.length > 0) {
        await messages.addRecipients(messageId, selectedRecipients);
      }

      setShowModal(false);
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save message');
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await messages.delete(messageId);
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleSend = async (messageId) => {
    if (!window.confirm('Are you sure you want to send this newsletter? This action cannot be undone.')) {
      return;
    }

    try {
      await messages.send(messageId);
      alert('Newsletter sent successfully!');
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  const toggleRecipient = (userId) => {
    setSelectedRecipients((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllRecipients = () => {
    setSelectedRecipients(usersList.map((u) => u.id));
  };

  const clearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      draft: 'status-draft',
      sent: 'status-sent'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  if (isLoading) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div className="messages-page">
      <h1>Messages & Newsletters</h1>

      {error && <div className="error-message">{error}</div>}

      {isAdmin && (
        <div className="controls">
          <button onClick={openCreateModal} className="btn-primary">
            Create New Message
          </button>
        </div>
      )}

      <table className="messages-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Sent At</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {messagesList.map((message) => (
            <tr key={message.id}>
              <td>{message.subject}</td>
              <td>{getStatusBadge(message.status)}</td>
              <td>{message.created_by_name || '-'}</td>
              <td>{new Date(message.created_at).toLocaleDateString()}</td>
              <td>{message.sent_at ? new Date(message.sent_at).toLocaleDateString() : '-'}</td>
              {isAdmin && (
                <td>
                  {message.status === 'draft' && (
                    <>
                      <button onClick={() => openEditModal(message)} className="btn-small">
                        Edit
                      </button>
                      <button onClick={() => handleSend(message.id)} className="btn-small btn-success">
                        Send
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(message.id)} className="btn-small btn-danger">
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {messagesList.length === 0 && <p className="no-results">No messages found.</p>}

      {/* Message Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMessage ? 'Edit Message' : 'Create New Message'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Message Body *</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows="10"
                  required
                />
              </div>

              <div className="form-group">
                <label>Recipients</label>
                <div className="recipients-controls">
                  <button type="button" onClick={selectAllRecipients} className="btn-small">
                    Select All
                  </button>
                  <button type="button" onClick={clearAllRecipients} className="btn-small">
                    Clear All
                  </button>
                  <span>{selectedRecipients.length} selected</span>
                </div>
                <div className="recipients-list">
                  {usersList.map((user) => (
                    <label key={user.id} className="recipient-item">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(user.id)}
                        onChange={() => toggleRecipient(user.id)}
                      />
                      <span>
                        {user.name} ({user.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingMessage ? 'Update' : 'Create Draft'}
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

export default Messages;
