import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Members from './pages/Members';
import Roles from './pages/Roles';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout Component with Navigation
const Layout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.roles?.includes('admin') || false;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>BMFVSE</h1>
        </div>
        <div className="navbar-menu">
          <Link to="/">Dashboard</Link>
          <Link to="/members">Members</Link>
          {isAdmin && <Link to="/roles">Roles</Link>}
          {isAdmin && <Link to="/messages">Messages</Link>}
          <Link to="/profile">Profile</Link>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
        <div className="navbar-user">
          <span>Welcome, {user.name || 'User'}</span>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to BMFVSE Management System</p>
      <div className="dashboard-info">
        <div className="info-card">
          <h3>Your Account</h3>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Status: {user.membership_status}</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <Layout>
                <Members />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <Layout>
                <Roles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Layout>
                <Messages />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
