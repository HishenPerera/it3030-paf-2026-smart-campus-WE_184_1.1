import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, updateUserRole, fetchCurrentUser, sendNotification, fetchNotificationBatches, deleteNotificationBatch } from '../api/api';
import NotificationBell from '../components/NotificationBell';
import './AdminPanel.css';

const NAV_ITEMS = [
  { id: 'overview', icon: 'bi-bar-chart-fill', label: 'Overview' },
  { id: 'users', icon: 'bi-people-fill', label: 'User Management' },
  { id: 'notifications', icon: 'bi-bell-fill', label: 'Send Notifications' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function AdminPanel() {
  const [activeNav, setActiveNav] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [roleChanges, setRoleChanges] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Table controls
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Notification form state
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('NOTIFICATION');
  const [notifTarget, setNotifTarget] = useState('ALL');
  const [expiresIn, setExpiresIn] = useState('NEVER');
  const [notifStatus, setNotifStatus] = useState(null);
  
  const [batches, setBatches] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const me = await fetchCurrentUser();
        if (me.role !== 'ADMIN') { navigate('/dashboard'); return; }
        setCurrentUser(me);
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
        const initial = {};
        allUsers.forEach(u => { initial[u.id] = u.role; });
        setRoleChanges(initial);
        
        const activeBatches = await fetchNotificationBatches();
        setBatches(activeBatches);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        } else {
          setError('Failed to load users.');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleRoleChange = (userId, newRole) =>
    setRoleChanges(prev => ({ ...prev, [userId]: newRole }));

  const handleSave = async (userId) => {
    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const updated = await updateUserRole(userId, roleChanges[userId]);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch {
      alert('Failed to update role. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure you want to permanently delete this broadcast?")) return;
    try {
      await deleteNotificationBatch(batchId);
      setBatches(prev => prev.filter(b => b.batchId !== batchId));
    } catch (err) {
      alert("Failed to delete broadcast");
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== 'ALL') list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = (a[sortKey] || '').toLowerCase();
      let bv = (b[sortKey] || '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, roleFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="sort-icon neutral">⇅</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Stats
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const userCount = users.filter(u => u.role === 'USER').length;

  if (loading) {
    return (
      <div className="admin-shell flex-center min-h-screen">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <i className="bi bi-mortarboard-fill brand-icon"></i>
          {sidebarOpen && <span className="brand-name">Smart Campus</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              title={!sidebarOpen ? item.label : undefined}
            >
              <i className={`bi ${item.icon} nav-icon`}></i>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
              {sidebarOpen && activeNav === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && currentUser && (
            <div className="sidebar-user">
              <img
                src={currentUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || currentUser.email)}&background=6366f1&color=fff`}
                alt="admin avatar"
                className="sidebar-avatar"
              />
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.name || 'Admin'}</span>
                <span className="sidebar-user-role">Administrator</span>
              </div>
            </div>
          )}
          <button
            className="sidebar-back-btn"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <i className="bi bi-house-door-fill"></i>
            {sidebarOpen && <span>Dashboard</span>}
          </button>
        </div>
      </aside>

      {/* ── Toggle Button ── */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(o => !o)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
      </button>

      {/* ── Main Content ── */}
      <main className={`admin-main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>

        {/* ── Top Bar ── */}
        <header className="admin-topbar glass-panel">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Admin Panel</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">
                {NAV_ITEMS.find(n => n.id === activeNav)?.label}
              </span>
            </div>
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <span className="total-badge">{users.length} Users</span>
            <div className="topbar-time">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* ── Page Body ── */}
        {error && <div className="error-banner">{error}</div>}

        {/* ── OVERVIEW TAB ── */}
        {activeNav === 'overview' && (
          <section className="content-section animate-fade-in">
            <div className="section-heading">
              <h1>Overview</h1>
              <p>Summary of your Smart Campus platform.</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-value">{users.length}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon admin-icon">
                  <i className="bi bi-shield-fill"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-value admin-value">{adminCount}</span>
                  <span className="stat-label">Admins</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon user-icon">
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-value user-value">{userCount}</span>
                  <span className="stat-label">Regular Users</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-info">
                  <span className="stat-value green-value">{users.length}</span>
                  <span className="stat-label">Active Accounts</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── USER MANAGEMENT TAB ── */}
        {activeNav === 'users' && (
          <section className="content-section animate-fade-in">
            <div className="section-heading">
              <h1>User Management</h1>
              <p>Manage roles for all registered Smart Campus users.</p>
            </div>

            {/* Controls */}
            <div className="table-controls glass-panel">
              <div className="controls-left">
                <div className="search-box">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="search-input"
                  />
                  {search && (
                    <button className="search-clear" onClick={() => { setSearch(''); setPage(1); }}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>

                <div className="filter-group">
                  {['ALL', 'ADMIN', 'USER'].map(r => (
                    <button
                      key={r}
                      className={`filter-chip ${roleFilter === r ? 'active' : ''}`}
                      onClick={() => { setRoleFilter(r); setPage(1); }}
                    >
                      {r === 'ALL' ? 'All Roles' : r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="controls-right">
                <span className="results-count">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
                <div className="page-size-select">
                  <label>Show</label>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="role-select"
                  >
                    {PAGE_SIZE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <label>per page</label>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="user-table-wrapper glass-panel">
              <table className="user-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      User <SortIcon col="name" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('email')}>
                      Email <SortIcon col="email" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('role')}>
                      Role <SortIcon col="role" />
                    </th>
                    <th>Change Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <i className="bi bi-search"></i>
                        <p>No users match your search.</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map(user => {
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
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination glass-panel">
                <div className="pagination-info">
                  Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    title="First page"
                  >«</button>
                  <button
                    className="page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    title="Previous page"
                  >‹</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '…'
                        ? <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                        : <button
                          key={p}
                          className={`page-btn ${page === p ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >{p}</button>
                    )
                  }

                  <button
                    className="page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    title="Next page"
                  >›</button>
                  <button
                    className="page-btn"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    title="Last page"
                  >»</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeNav === 'notifications' && (
          <section className="content-section animate-fade-in">
            <div className="section-heading">
              <h1>Send Notifications</h1>
              <p>Broadcast alerts or regular notifications to users across the platform.</p>
            </div>
            
            <div className="notification-form-card glass-panel">
              {notifStatus && (
                <div className={`form-status-banner ${notifStatus.error ? 'status-error' : 'status-success'}`}>
                  {notifStatus.message}
                </div>
              )}
              <form onSubmit={async (e) => {
                e.preventDefault();
                setNotifStatus(null);
                if (!notifMessage.trim()) return;
                
                try {
                  await sendNotification({
                    message: notifMessage,
                    type: notifType,
                    target: notifTarget,
                    expiresIn: expiresIn
                  });
                  setNotifStatus({ error: false, message: 'Notification sent successfully!' });
                  setNotifMessage('');
                  // Refresh history
                  const bList = await fetchNotificationBatches();
                  setBatches(bList);
                } catch (err) {
                  setNotifStatus({ error: true, message: 'Failed to send notification.' });
                }
              }} className="notification-form">
                
                <div className="form-group">
                  <label>Message Content</label>
                  <textarea 
                    value={notifMessage} 
                    onChange={e => setNotifMessage(e.target.value)}
                    placeholder="Enter notification or alert message..."
                    required
                    className="notif-textarea"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select 
                      value={notifType} 
                      onChange={e => setNotifType(e.target.value)}
                      className="notif-select"
                    >
                      <option value="NOTIFICATION">Standard Notification</option>
                      <option value="ALERT">Global Alert (Banner)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Audience</label>
                    <select 
                      value={notifTarget} 
                      onChange={e => setNotifTarget(e.target.value)}
                      className="notif-select"
                    >
                      <option value="ALL">All Users</option>
                      <option value="USERS">Normal Users Only</option>
                      <option value="ADMINS">Administrators Only</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Expires In</label>
                    <select 
                      value={expiresIn} 
                      onChange={e => setExpiresIn(e.target.value)}
                      className="notif-select"
                    >
                      <option value="NEVER">Never / Manual Deletion</option>
                      <option value="1HR">1 Hour</option>
                      <option value="12HR">12 Hours</option>
                      <option value="1DAY">1 Day</option>
                      <option value="3DAY">3 Days</option>
                      <option value="7DAY">7 Days</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="send-notif-btn" disabled={!notifMessage.trim()}>
                  <i className="bi bi-send-fill"></i> Send Notification
                </button>
              </form>
            </div>

            <div className="section-heading" style={{ marginTop: '40px' }}>
              <h2>Active Broadcasts</h2>
              <p>Manage sent notifications and delete them to remove from all user queues.</p>
            </div>
            
            <div className="user-table-wrapper glass-panel">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Dates (Sent / Expires)</th>
                    <th>Message</th>
                    <th>Type</th>
                    <th>Reach</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <i className="bi bi-broadcast"></i>
                        <p>No active broadcasts right now.</p>
                      </td>
                    </tr>
                  ) : (
                    batches.map(b => (
                      <tr key={b.batchId}>
                        <td>
                          <div><b>Sent:</b> {new Date(b.createdAt).toLocaleString()}</div>
                          <div><b>Expiry:</b> {b.expiresAt ? new Date(b.expiresAt).toLocaleString() : 'Never'}</div>
                        </td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{b.message}</td>
                        <td>
                          <span className={`role-badge role-${b.type.toLowerCase()}`}>{b.type}</span>
                        </td>
                        <td>{b.count} Users</td>
                        <td>
                          <button 
                            className="delete-batch-btn"
                            onClick={() => handleDeleteBatch(b.batchId)}
                            title="Delete this broadcast globally"
                          >
                            <i className="bi bi-trash-fill"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}
      </main>
    </div>
  );
}
