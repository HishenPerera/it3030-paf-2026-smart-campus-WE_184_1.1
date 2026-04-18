import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, logout } from '../api/api';
import NotificationBell from '../components/NotificationBell';
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
          <NotificationBell />
          <img src={user.picture || user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="avatar" />
          <div className="profile-info">
            <span className="profile-name">{user.name || user.login}</span>
            <span className="profile-email">{user.email}</span>
          </div>
          {user.role === 'ADMIN' && (
            <button className="admin-btn" onClick={() => navigate('/admin')}>Admin Panel</button>
          )}
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

          <div className="action-cards-container" style={{ marginTop: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="action-card glass-panel" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)' }}>
              <h3>Maintenance & Incidents</h3>
              <p style={{ margin: '1rem 0', color: 'rgba(255,255,255,0.7)' }}>Report issues or request maintenance for campus facilities, classrooms, or equipment.</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/create-ticket')}
                style={{ width: '100%', padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
              >
                Create New Ticket
              </button>
            </div>

            <div className="action-card glass-panel" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)' }}>
              <h3>Track & Manage Tickets</h3>
              <p style={{ margin: '1rem 0', color: 'rgba(255,255,255,0.7)' }}>Browse, track, and filter the status of incidents assigned to your role layer.</p>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/tickets')}
                style={{ width: '100%', padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
              >
                View Tickets
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
