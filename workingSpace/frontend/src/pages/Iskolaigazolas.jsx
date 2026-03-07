import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';
import api from '../services/api';

export default function Iskolaigazolas() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: ''
  });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await api.get('/members');
      setMembers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMemberClick(member) {
    setSelectedMember(member);
    try {
      // Fetch detailed user information and their certificates
      const [userRes, certsRes] = await Promise.all([
        api.get(`/users/${member.id}`),
        api.get('/certificates')
      ]);
      setMemberDetails(userRes.data);
      // Filter certificates for this user
      setCertificates((certsRes.data || []).filter(cert => cert.user_id === member.id));
    } catch (err) {
      console.error(err);
    }
  }

  function openCreateModal() {
    setShowCreateModal(true);
    setCreateForm({
      title: 'Iskolai igazolás',
      content: '',
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: ''
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.post('/certificates', {
        ...createForm,
        user_id: selectedMember.id
      });
      setFeedback({ type: 'success', message: 'Igazolás sikeresen létrehozva!' });
      setShowCreateModal(false);
      // Refresh certificates
      handleMemberClick(selectedMember);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Hiba az igazolás létrehozása során!' });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Biztosan törli ezt az igazolást?')) return;
    try {
      await api.delete(`/certificates/${id}`);
      setFeedback({ type: 'success', message: 'Igazolás törölve!' });
      // Refresh certificates
      handleMemberClick(selectedMember);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Hiba a törlés során!' });
    }
  }

  function goBack() {
    setSelectedMember(null);
    setMemberDetails(null);
    setCertificates([]);
  }

  if (!isAdmin()) {
    return (
      <div className="main-content">
        <Navbar />
        <div className="container">
          <p style={{color: 'white'}}>Hozzáférés megtagadva.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <Navbar />
      <div className="container">
        <h1>Iskolaigazolás</h1>
        {feedback && (
          <div className={`feedback feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {!selectedMember ? (
          /* Tagok listája */
          <div className="card" style={{maxWidth: '900px', margin: '0 auto'}}>
            <h2 style={{color: '#1976D2', marginBottom: '16px'}}>Tagok</h2>
            {loading ? <p>Betöltés...</p> : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {members.map(member => (
                  <div
                    key={member.id}
                    className="list-item"
                    onClick={() => handleMemberClick(member)}
                    style={{cursor: 'pointer', padding: '16px', borderRadius: '8px', background: 'rgba(30, 136, 229, 0.05)', transition: 'all 0.2s'}}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 136, 229, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(30, 136, 229, 0.05)'}
                  >
                    <strong style={{fontSize: '1.1rem', color: '#0D47A1'}}>{member.first_name} {member.last_name}</strong>
                    <p className="text-secondary" style={{margin: '4px 0 0 0'}}>{member.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tag részletes adatai */
          <div style={{maxWidth: '1200px', margin: '0 auto'}}>
            <button
              className="btn"
              onClick={goBack}
              style={{marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px'}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Vissza a tagokhoz
            </button>

            <div className="profile-layout">
              <div className="info-panel" style={{gridColumn: '1 / -1'}}>
                <div className="info-card">
                  <h3>Személyes Adatok</h3>
                  <p><strong>Név:</strong> {memberDetails?.name || `${selectedMember.first_name} ${selectedMember.last_name}`}</p>
                  <p><strong>Email:</strong> {memberDetails?.email || selectedMember.email}</p>
                  <p><strong>Telefon:</strong> {memberDetails?.phone || '-'}</p>
                  <p><strong>Cím:</strong> {memberDetails?.address || '-'}</p>
                  <p><strong>Regisztráció:</strong> {memberDetails?.created_at ? new Date(memberDetails.created_at).toLocaleDateString('hu-HU') : '-'}</p>
                </div>

                <div className="info-card">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <h3 style={{margin: 0}}>Igazolások ({certificates.length})</h3>
                    <button className="btn-add" onClick={openCreateModal}>
                      Új igazolás létrehozása
                    </button>
                  </div>
                  {certificates.length === 0 ? (
                    <p style={{color: '#666'}}>Még nincsenek igazolások ehhez a taghoz.</p>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      {certificates.map(cert => (
                        <div key={cert.id} className="message-item">
                          <div className="message-item-body">
                            <strong>{cert.title}</strong>
                            <p className="text-muted">
                              Kiállítva: {new Date(cert.issue_date).toLocaleDateString('hu-HU')}
                              {cert.valid_until && ` | Érvényes: ${new Date(cert.valid_until).toLocaleDateString('hu-HU')}-ig`}
                            </p>
                            {cert.content && (
                              <div style={{marginTop: '8px', padding: '8px', background: 'rgba(30, 136, 229, 0.05)', borderRadius: '4px', fontSize: '0.9rem'}}>
                                <p style={{whiteSpace: 'pre-wrap', margin: 0}}>{cert.content}</p>
                              </div>
                            )}
                          </div>
                          <div className="message-item-actions">
                            <button className="btn-danger" onClick={() => handleDelete(cert.id)}>
                              Törlés
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Létrehozás Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
              <h2>Igazolás létrehozása</h2>
              <p style={{marginBottom: '16px'}}>
                <strong>Tag:</strong> {selectedMember.first_name} {selectedMember.last_name}
              </p>
              <form onSubmit={handleCreate}>
                <label>Cím:</label>
                <input
                  className="form-input"
                  value={createForm.title}
                  onChange={e => setCreateForm({...createForm, title: e.target.value})}
                  required
                />
                <label>Tartalom:</label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={createForm.content}
                  onChange={e => setCreateForm({...createForm, content: e.target.value})}
                  placeholder="Az igazolás tartalma..."
                  required
                />
                <label>Kiállítás dátuma:</label>
                <input
                  className="form-input"
                  type="date"
                  value={createForm.issue_date}
                  onChange={e => setCreateForm({...createForm, issue_date: e.target.value})}
                  required
                />
                <label>Érvényesség vége (opcionális):</label>
                <input
                  className="form-input"
                  type="date"
                  value={createForm.valid_until}
                  onChange={e => setCreateForm({...createForm, valid_until: e.target.value})}
                />
                <div className="btn-row">
                  <button className="btn" type="submit">Létrehozás</button>
                  <button className="btn" type="button" onClick={() => setShowCreateModal(false)}>
                    Mégse
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
