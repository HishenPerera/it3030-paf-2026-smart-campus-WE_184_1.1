import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, fetchDashboardStats, logout } from '../api/api';
import NotificationBell from '../components/NotificationBell';
import useNotifications from '../context/useNotifications';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { normalNotifications } = useNotifications();

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch {
        // Don't block dashboard on stats failures
      }
    };
    loadStats();
  }, []);

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

  const role = user.role || 'USER';
  const quickActions = [
    ...(role === 'ADMIN'
      ? [{ id: 'admin-tickets', label: 'Ticket Management', hint: 'Manage all tickets', enabled: true, onClick: () => navigate('/admin') }]
      : []),
    ...(role === 'TECHNICIAN'
      ? [{ id: 'assigned-tickets', label: 'Assigned Tickets', hint: 'View tickets assigned to you', enabled: true, onClick: () => navigate('/tickets') }]
      : []),
    ...(role === 'USER'
      ? [
          { id: 'report-incident', label: 'Report Incident', hint: 'Create a maintenance ticket', enabled: true, onClick: () => navigate('/create-ticket') },
          { id: 'my-tickets', label: 'View My Tickets', hint: 'Track ticket status', enabled: true, onClick: () => navigate('/tickets') },
        ]
      : []),
    { id: 'create-booking', label: 'Create Booking', hint: 'Coming soon', enabled: false, onClick: () => {} },
    { id: 'view-resources', label: 'View Resources', hint: 'Coming soon', enabled: false, onClick: () => {} },
  ];

  const recentNotifications = (normalNotifications || []).slice(0, 5);

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

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{stats.totalOpenTickets}</h3>
                  <p>Total Open Tickets</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <h3>{stats.ticketsInProgress}</h3>
                  <p>Tickets In Progress</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{stats.resolvedTickets}</h3>
                  <p>Resolved Tickets</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-content">
                  <h3>{stats.highPriorityIncidents}</h3>
                  <p>High Priority Incidents</p>
                </div>
              </div>
              <div className="stat-card stat-full-width">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <h3>{stats.averageResolutionTime}</h3>
                  <p>Average Resolution Time</p>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-panels">
            <section className="dashboard-panel glass-panel">
              <div className="panel-header">
                <h3>Quick Actions</h3>
                <span className="panel-subtitle">One-click shortcuts</span>
              </div>
              <div className="quick-actions-grid">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    type="button"
                    className={`quick-action-btn ${action.enabled ? '' : 'disabled'}`}
                    onClick={action.onClick}
                    disabled={!action.enabled}
                    title={action.enabled ? action.hint : action.hint}
                  >
                    <span className="quick-action-label">{action.label}</span>
                    {action.hint && <span className="quick-action-hint">{action.hint}</span>}
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-panel glass-panel">
              <div className="panel-header">
                <h3>Recent Notifications</h3>
                <span className="panel-subtitle">Latest updates for you</span>
              </div>
              {recentNotifications.length === 0 ? (
                <div className="empty-note">No notifications yet.</div>
              ) : (
                <div className="recent-notifications">
                  {recentNotifications.map(n => (
                    <div key={n.id} className={`recent-notification ${n.isRead ? 'read' : 'unread'}`}>
                      <div className="recent-notification-message">{n.message}</div>
                      <div className="recent-notification-time">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
