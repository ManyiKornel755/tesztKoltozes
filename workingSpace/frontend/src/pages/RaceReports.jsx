import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../utils/AuthContext';

const RaceReports = () => {
  const [reports, setReports] = useState([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/race-reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch race reports:', error);
    }
  };

  const handleExport = async (id, raceName) => {
    try {
      const response = await api.get(`/race-reports/${id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${raceName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export race report:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Race Reports</h1>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Race Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.race_name}</td>
                  <td>{new Date(report.race_date).toLocaleDateString()}</td>
                  <td>{report.location || 'N/A'}</td>
                  <td>{report.status}</td>
                  <td>
                    <button 
                      onClick={() => handleExport(report.id, report.race_name)} 
                      className="btn btn-primary"
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RaceReports;
