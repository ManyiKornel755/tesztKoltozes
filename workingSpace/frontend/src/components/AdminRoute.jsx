import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Betöltés...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return isAdmin() ? children : <Navigate to="/" />;
};

export default AdminRoute;
