import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, updateUserRole, fetchCurrentUser } from '../api/api';
import './AdminPanel.css';

export default function AdminPanel() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState({});
  const [error, setError]         = useState(null);
  const [roleChanges, setRoleChanges] = useState({});
  const navigate                  = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // Verify the current user is ADMIN
        const me = await fetchCurrentUser();
        if (me.role !== 'ADMIN') {
          navigate('/dashboard');
          return;
        }
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
        // Build default role state from fetched users
        const initial = {};
        allUsers.forEach(u => { initial[u.id] = u.role; });
        setRoleChanges(initial);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        } else {
          setError('Failed to load users. Are you an admin?');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const handleSave = async (userId) => {
    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const updated = await updateUserRole(userId, roleChanges[userId]);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (err) {
      alert('Failed to update role. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="admin-container min-h-screen flex-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="admin-container min-h-screen animate-fade-in">
      <header className="admin-header glass-panel">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <h2>Admin Panel</h2>
        </div>
        <span className="user-count">{users.length} Users Registered</span>
      </header>

      <main className="admin-main">
        {error && <div className="error-banner">{error}</div>}

        <div className="section-header">
          <h1>User Management</h1>
          <p>Manage roles for all registered SLIIT Bookings users.</p>
        </div>

        <div className="user-table-wrapper glass-panel">
          <table className="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Change Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const isDirty = roleChanges[user.id] !== user.role;
                return (
                  <tr key={user.id} className={isDirty ? 'row-dirty' : ''}>
                    <td className="user-cell">
                      <img
                        src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366f1&color=fff`}
                        alt="avatar"
                        className="row-avatar"
                      />
                      <span>{user.name || '—'}</span>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <select
                        className="role-select"
                        value={roleChanges[user.id] || user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`save-btn ${isDirty ? 'save-btn-active' : ''}`}
                        onClick={() => handleSave(user.id)}
                        disabled={!isDirty || saving[user.id]}
                      >
                        {saving[user.id] ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
