import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Betöltés...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
