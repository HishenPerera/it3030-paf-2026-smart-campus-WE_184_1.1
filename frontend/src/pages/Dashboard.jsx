import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, logout } from '../api/api';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      // Regardless of failure, force the frontend to clear and return to login
      setUser(null);
      navigate('/login');
    }
  };

  useEffect(() => {
    // Fetch user details from the backend endpoint
    const fetchUser = async () => {
      try {
        const data = await fetchCurrentUser();
        setUser(data);
      } catch (err) {
        // 401 Unauthorized or network error → redirect to login
        console.error('Not authenticated:', err.response?.status);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-container min-h-screen flex-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="dashboard-container min-h-screen animate-fade-in">
      <header className="dashboard-header glass-panel">
        <div className="header-brand">
          <h2>SLIIT Bookings</h2>
        </div>
        <div className="header-profile">
          <img src={user.picture || user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="avatar" />
          <div className="profile-info">
            <span className="profile-name">{user.name || user.login}</span>
            <span className="profile-email">{user.email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card glass-panel">
          <h1>Welcome back, {user.given_name || user.name || user.login}!</h1>
          <p>You have successfully authenticated via OAuth2 through Spring Boot.</p>
          
          <div className="raw-data-section">
            <h3>Your OAuth Profile Context:</h3>
            <pre className="code-block">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
