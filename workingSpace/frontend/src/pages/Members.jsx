import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../utils/AuthContext';

const Members = () => {
  const [members, setMembers] = useState([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Biztosan törli ezt a tagot?')) return;

    try {
      await api.delete(`/members/${id}`);
      fetchMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Tagok</h1>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Név</th>
                <th>Email</th>
                <th>Telefon</th>
                {isAdmin() && <th>Műveletek</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.first_name} {member.last_name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone || '—'}</td>
                  {isAdmin() && (
                    <td>
                      <button onClick={() => handleDelete(member.id)} className="btn btn-danger">Törlés</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Members;
