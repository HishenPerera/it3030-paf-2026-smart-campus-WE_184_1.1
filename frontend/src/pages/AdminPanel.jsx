import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsers, updateUserRole, fetchCurrentUser } from '../api/api';
import './AdminPanel.css';

const NAV_ITEMS = [
  { id: 'overview', icon: 'bi-bar-chart-fill', label: 'Overview' },
  { id: 'users', icon: 'bi-people-fill', label: 'User Management' },
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
      </main>
    </div>
  );
}
