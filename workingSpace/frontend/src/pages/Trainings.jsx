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
    if (!window.confirm('Are you sure you want to delete this training?')) return;

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
        <h1>Trainings</h1>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                {isAdmin() && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {trainings.map((training) => (
                <tr key={training.id}>
                  <td>{training.title}</td>
                  <td>{new Date(training.event_date).toLocaleString()}</td>
                  <td>{training.location || 'N/A'}</td>
                  {isAdmin() && (
                    <td>
                      <button onClick={() => handleDelete(training.id)} className="btn btn-danger">Delete</button>
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
