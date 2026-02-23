import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../utils/AuthContext';

const Trainings = () => {
  const [trainings, setTrainings] = useState([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await api.get('/trainings');
      setTrainings(response.data);
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Biztosan törli ezt az edzést?')) return;

    try {
      await api.delete(`/trainings/${id}`);
      fetchTrainings();
    } catch (error) {
      console.error('Failed to delete training:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Edzések</h1>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Cím</th>
                <th>Dátum</th>
                <th>Helyszín</th>
                {isAdmin() && <th>Műveletek</th>}
              </tr>
            </thead>
            <tbody>
              {trainings.map((training) => (
                <tr key={training.id}>
                  <td>{training.title}</td>
                  <td>{new Date(training.event_date).toLocaleString('hu-HU')}</td>
                  <td>{training.location || '—'}</td>
                  {isAdmin() && (
                    <td>
                      <button onClick={() => handleDelete(training.id)} className="btn btn-danger">Törlés</button>
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

export default Trainings;
