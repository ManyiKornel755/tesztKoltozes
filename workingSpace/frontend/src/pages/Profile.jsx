import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../utils/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Profile</h1>
        <div className="card">
          <h3>{user?.firstName} {user?.lastName}</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'No roles'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
