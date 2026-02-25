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
      <div className="container navbar-inner">
        <div>
          <Link to="/">Irányítópult</Link>
          <Link to="/trainings">Edzések</Link>
          <Link to="/race-reports">Versenyjelentések</Link>
          <Link to="/messages">Üzenetek</Link>
          {isAdmin() && <Link to="/users">Felhasználók</Link>}
          {isAdmin() && <Link to="/roles">Szerepkörök</Link>}
          {isAdmin() && <Link to="/groups">Csoportok</Link>}
          {isAdmin() && <Link to="/emails">Email küldés</Link>}
        </div>
        <div className="navbar-user-section">
          <Link to="/profile">{user?.firstName} {user?.lastName}</Link>
          <button onClick={handleLogout} className="btn navbar-logout-btn">Kijelentkezés</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
