import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/">Dashboard</Link>
          <Link to="/members">Members</Link>
          <Link to="/trainings">Trainings</Link>
          <Link to="/race-reports">Race Reports</Link>
          <Link to="/messages">Messages</Link>
          {isAdmin() && <Link to="/users">Users</Link>}
          {isAdmin() && <Link to="/roles">Roles</Link>}
          {isAdmin() && <Link to="/groups">Csoportok</Link>}
        </div>
        <div>
          <Link to="/profile">{user?.firstName} {user?.lastName}</Link>
          <button onClick={handleLogout} className="btn" style={{ marginLeft: '10px' }}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
