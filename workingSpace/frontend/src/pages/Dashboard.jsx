import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    members: 0,
    trainings: 0,
    raceReports: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [membersRes, trainingsRes, reportsRes] = await Promise.all([
          api.get('/members'),
          api.get('/trainings'),
          api.get('/race-reports')
        ]);

        setStats({
          members: membersRes.data.length,
          trainings: trainingsRes.data.length,
          raceReports: reportsRes.data.length
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div className="card">
            <h3>Members</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{stats.members}</p>
          </div>
          <div className="card">
            <h3>Trainings</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.trainings}</p>
          </div>
          <div className="card">
            <h3>Race Reports</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.raceReports}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
