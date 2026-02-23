import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setError('A csoportok betöltése sikertelen');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/members');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');

    if (!newGroupName.trim()) {
      setError('A csoport neve kötelező');
      return;
    }

    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      setShowCreateModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      setError(error.response?.data?.error || 'A csoport létrehozása sikertelen');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Biztosan törli ezt a csoportot?')) return;

    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      setError('A csoport törlése sikertelen');
    }
  };

  const openEditModal = async (group) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setError('');

    try {
      const response = await api.get(`/groups/${group.id}/members`);
      setGroupMembers(response.data);
      setSelectedUsers([]);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      setError('A csoport tagjainak betöltése sikertelen');
    }
  };

  const handleUpdateGroupName = async (e) => {
    e.preventDefault();
    setError('');

    if (!editGroupName.trim()) {
      setError('A csoport neve kötelező');
      return;
    }

    try {
      await api.put(`/groups/${selectedGroup.id}`, { name: editGroupName });
      fetchGroups();
      setSelectedGroup({ ...selectedGroup, name: editGroupName });
    } catch (error) {
      console.error('Failed to update group name:', error);
      setError(error.response?.data?.error || 'A csoport nevének frissítése sikertelen');
    }
  };

  const handleAddMembers = async () => {
    setError('');

    if (selectedUsers.length === 0) {
      setError('Válasszon ki legalább egy felhasználót');
      return;
    }

    if (selectedUsers.length > 50) {
      setError('Egyszerre maximum 50 tagot adhat hozzá');
      return;
    }

    try {
      await api.post(`/groups/${selectedGroup.id}/members`, {
        userIds: selectedUsers
      });

      const response = await api.get(`/groups/${selectedGroup.id}/members`);
      setGroupMembers(response.data);
      setSelectedUsers([]);
      fetchGroups();
    } catch (error) {
      console.error('Failed to add members:', error);
      setError(error.response?.data?.error || 'A tagok hozzáadása sikertelen');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Biztosan eltávolítja ezt a tagot a csoportból?')) return;

    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${userId}`);

      const response = await api.get(`/groups/${selectedGroup.id}/members`);
      setGroupMembers(response.data);
      fetchGroups();
    } catch (error) {
      console.error('Failed to remove member:', error);
      setError('A tag eltávolítása sikertelen');
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const availableUsers = users.filter(
    user => !groupMembers.some(member => member.id === user.id)
  );

  return (
    <div>
      <Navbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Csoportok</h1>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Csoport létrehozása
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Csoport neve</th>
                <th>Tagok</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>Nincs csoport</td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.member_count || 0}</td>
                    <td>
                      <button onClick={() => openEditModal(group)} className="btn btn-secondary" style={{ marginRight: '10px' }}>
                        Szerkesztés
                      </button>
                      <button onClick={() => handleDeleteGroup(group.id)} className="btn btn-danger">
                        Törlés
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Új csoport létrehozása</h2>
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label>Csoport neve:</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Adja meg a csoport nevét"
                    required
                  />
                </div>
                <div className="modal-buttons">
                  <button type="submit" className="btn btn-primary">Létrehozás</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    Mégse
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedGroup && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
              <h2>Csoport szerkesztése: {selectedGroup.name}</h2>

              <form onSubmit={handleUpdateGroupName} style={{ marginBottom: '30px' }}>
                <div className="form-group">
                  <label>Csoport neve:</label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Név frissítése</button>
              </form>

              <h3>Jelenlegi tagok ({groupMembers.length})</h3>
              {groupMembers.length === 0 ? (
                <p>Még nincsenek tagok ebben a csoportban</p>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Név</th>
                        <th>Email</th>
                        <th>Művelet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map((member) => (
                        <tr key={member.id}>
                          <td>{member.first_name} {member.last_name}</td>
                          <td>{member.email}</td>
                          <td>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="btn btn-danger"
                              style={{ padding: '5px 10px', fontSize: '0.9em' }}
                            >
                              Eltávolítás
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3>Tagok hozzáadása</h3>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Válassza ki a hozzáadandó felhasználókat (max 50 egyszerre). Kiválasztva: {selectedUsers.length}
              </p>

              {availableUsers.length === 0 ? (
                <p>Minden felhasználó már tagja ennek a csoportnak</p>
              ) : (
                <>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
                    {availableUsers.map((user) => (
                      <div key={user.id} style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                            style={{ marginRight: '10px' }}
                          />
                          <span>{user.first_name} {user.last_name} ({user.email})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddMembers}
                    className="btn btn-primary"
                    disabled={selectedUsers.length === 0}
                  >
                    Kiválasztott tagok hozzáadása ({selectedUsers.length})
                  </button>
                </>
              )}

              <div className="modal-buttons" style={{ marginTop: '20px' }}>
                <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .alert {
          padding: 12px;
          margin-bottom: 20px;
          border-radius: 4px;
        }

        .alert-danger {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default Groups;
