import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  fetchAllUsers, updateUserRole, fetchCurrentUser, sendNotification,
  fetchNotificationBatches, deleteNotificationBatch, fetchTickets,
  fetchTechnicians, fetchResources, createResource, updateResource,
  deleteResource, fetchAllReservations, cancelReservation, confirmReservation
} from '../api/api';
import NotificationBell from '../components/NotificationBell';
import useNotifications from '../context/useNotifications';
import './AdminPanel.css';

const ALL_NAV_ITEMS = [
  { id: 'overview', icon: 'bi-bar-chart-fill', label: 'Overview', roles: ['ADMIN'] },
  { id: 'tickets', icon: 'bi-wrench-adjustable-circle-fill', label: 'Ticket Management', roles: ['ADMIN', 'TECHNICIAN'] },
  { id: 'resources', icon: 'bi-building-fill-gear', label: 'Facility Management', roles: ['ADMIN'] },
  { id: 'reservations', icon: 'bi-calendar-check-fill', label: 'All Reservations', roles: ['ADMIN'] },
  { id: 'users', icon: 'bi-people-fill', label: 'User Management', roles: ['ADMIN'] },
  { id: 'notifications', icon: 'bi-bell-fill', label: 'Send Notifications', roles: ['ADMIN'] },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function AdminPanel() {
  const [activeNav, setActiveNav] = useState('tickets');
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
  const { showNotification } = useNotifications();

  // Ticket management state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [ticketFilters, setTicketFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    resource: '',
    technicianId: '',
    startDate: '',
    endDate: ''
  });

  // Resource management state
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [newResource, setNewResource] = useState({ name: '', location: '', type: 'LIBRARY_SEAT' });
  const [resSearch, setResSearch] = useState('');
  const [resTypeFilter, setResTypeFilter] = useState('ALL');
  const [resStatusFilter, setResStatusFilter] = useState('ALL');
  const [editingResource, setEditingResource] = useState(null); // id of row being inline-edited
  const [editFields, setEditFields] = useState({});

  // Reservations state
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [resFilter, setResFilter] = useState('ALL');
  const [resUserSearch, setResUserSearch] = useState('');

  // Admin reservation modal
  const [adminCancelModal, setAdminCancelModal] = useState(null); // { id, resourceName, userName }
  const [adminCancelReason, setAdminCancelReason] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      try {
        const me = await fetchCurrentUser();
        // Only USER role cannot access admin panel
        if (me.role !== 'ADMIN' && me.role !== 'TECHNICIAN') { navigate('/dashboard'); return; }
        setCurrentUser(me);

        // Handle initial tab from location state
        if (location.state?.tab) {
          setActiveNav(location.state.tab);
        } else if (me.role === 'TECHNICIAN') {
          setActiveNav('tickets');
        }

        if (me.role === 'ADMIN') {
          const allUsers = await fetchAllUsers();
          setUsers(allUsers);
          const initial = {};
          allUsers.forEach(u => { initial[u.id] = u.role; });
          setRoleChanges(initial);

          try {
            const techList = await fetchTechnicians();
            setTechnicians(techList);
          } catch {
            // ignore technician list failures
          }

          const activeBatches = await fetchNotificationBatches();
          setBatches(activeBatches);
        } else if (me.role === 'TECHNICIAN') {
          // Technicians only need the technician list for filtering
          try {
            const techList = await fetchTechnicians();
            setTechnicians(techList);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        } else {
          setError('Failed to load data.');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (activeNav !== 'tickets') return;
    const load = async () => {
      setTicketsLoading(true);
      try {
        const params = {};
        Object.keys(ticketFilters).forEach(k => {
          if (ticketFilters[k]) params[k] = ticketFilters[k];
        });
        const data = await fetchTickets(params);
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setError('Failed to load tickets.');
      } finally {
        setTicketsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== 'resources') return;
    const loadResources = async () => {
      setResourcesLoading(true);
      try {
        const data = await fetchResources();
        setResources(data);
      } catch {
        setError('Failed to load campus resources.');
      } finally {
        setResourcesLoading(false);
      }
    };
    loadResources();
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== 'reservations') return;
    const loadReservations = async () => {
      setReservationsLoading(true);
      try {
        const data = await fetchAllReservations();
        setReservations(data);
      } catch {
        setError('Failed to load reservations.');
      } finally {
        setReservationsLoading(false);
      }
    };
    loadReservations();
  }, [activeNav]);

  const applyTicketFilters = async (e) => {
    e.preventDefault();
    setTicketsLoading(true);
    try {
      const params = {};
      Object.keys(ticketFilters).forEach(k => {
        if (ticketFilters[k]) params[k] = ticketFilters[k];
      });
      const data = await fetchTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load tickets.');
    } finally {
      setTicketsLoading(false);
    }
  };

  const clearTicketFilters = async () => {
    const empty = { search: '', status: '', priority: '', category: '', resource: '', technicianId: '', startDate: '', endDate: '' };
    setTicketFilters(empty);
    setTicketsLoading(true);
    try {
      const data = await fetchTickets({});
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load tickets.');
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) =>
    setRoleChanges(prev => ({ ...prev, [userId]: newRole }));

  const handleSave = async (userId) => {
    setSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const updated = await updateUserRole(userId, roleChanges[userId]);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      setRoleChanges(prev => ({ ...prev, [userId]: updated.role }));
      showNotification(`Role for ${updated.name || updated.email} updated to ${updated.role}`, 'success');
    } catch (err) {
      console.error("Role update failed:", err);
      showNotification('Failed to update role: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newResource.name || !newResource.location) {
      showNotification('Name and location are required.', 'error');
      return;
    }
    try {
      const created = await createResource(newResource);
      setResources(prev => [...prev, created]);
      setNewResource({ name: '', location: '', type: 'LIBRARY_SEAT' });
      showNotification(`Resource "${created.name}" added successfully.`, 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to create resource.', 'error');
    }
  };

  const handleUpdateResourceStatus = async (resource, newStatus) => {
    try {
      const updated = await updateResource(resource.id, { ...resource, status: newStatus });
      setResources(prev => prev.map(r => r.id === resource.id ? updated : r));
      showNotification(`"${resource.name}" set to ${newStatus}.`, 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update resource status.', 'error');
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("Delete this resource permanently?")) return;
    try {
      await deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      showNotification('Resource deleted successfully.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete resource.', 'error');
    }
  };

  const handleAdminCancelReservation = (id, resourceName, userName) => {
    setAdminCancelModal({ id, resourceName, userName });
    setAdminCancelReason('');
  };

  const doAdminCancel = async () => {
    if (!adminCancelModal) return;
    try {
      await cancelReservation(adminCancelModal.id, adminCancelReason);
      setReservations(prev => prev.map(r => r.id === adminCancelModal.id ? { ...r, status: 'CANCELLED', cancellationReason: adminCancelReason } : r));
      showNotification('Reservation cancelled and student notified.', 'success');
      setAdminCancelModal(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to cancel reservation.', 'error');
    }
  };

  const handleAdminConfirmReservation = async (id) => {
    try {
      const updated = await confirmReservation(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'CONFIRMED' } : r));
      showNotification('Reservation confirmed! Student has been notified.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to confirm reservation.', 'error');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Are you sure you want to permanently delete this broadcast?")) return;
    try {
      await deleteNotificationBatch(batchId);
      setBatches(prev => prev.filter(b => b.batchId !== batchId));
    } catch {
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

      {/* ── Admin Cancel Reason Modal ── */}
      {adminCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface-primary, #0f1829)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '1.75rem', width: 380, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.85rem' }}>
              <i className="bi bi-x-circle-fill" style={{ color: '#ef4444', fontSize: '1.1rem' }}></i>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cancel Reservation</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Cancelling <strong style={{ color: 'var(--text-primary)' }}>{adminCancelModal.resourceName}</strong> for <strong style={{ color: 'var(--text-primary)' }}>{adminCancelModal.userName}</strong>.<br />
              A notification with the reason will be sent to the student.
            </p>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Cancellation Reason <span style={{ color: '#64748b' }}>(optional)</span>
            </label>
            <textarea
              value={adminCancelReason}
              onChange={e => setAdminCancelReason(e.target.value)}
              placeholder="e.g. Resource under emergency maintenance, double booking..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.83rem',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
              <button onClick={doAdminCancel} className="save-btn" style={{
                flex: 1, background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: '0.85rem',
              }}>Cancel &amp; Notify Student</button>
              <button onClick={() => setAdminCancelModal(null)} className="save-btn" style={{
                flex: 1, fontSize: '0.85rem',
              }}>Keep Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <i className="bi bi-mortarboard-fill brand-icon"></i>
          {sidebarOpen && <span className="brand-name">Smart Campus</span>}
        </div>

        <nav className="sidebar-nav">
          {ALL_NAV_ITEMS
            .filter(item => item.roles.includes(currentUser?.role))
            .map(item => (
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
                <span className="sidebar-user-role">{currentUser.role === 'TECHNICIAN' ? 'Technician' : 'Administrator'}</span>
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
              <span className="breadcrumb-root">{currentUser?.role === 'TECHNICIAN' ? 'Technician Panel' : 'Admin Panel'}</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">
                {ALL_NAV_ITEMS.find(n => n.id === activeNav)?.label}
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

        {/* ── TICKETS TAB ── */}
        {activeNav === 'tickets' && (
          <section className="content-section animate-fade-in">
            <div className="section-heading">
              <h1>Ticket Management</h1>
              <p>Review, filter, and manage all maintenance & incident tickets.</p>
            </div>

            <div className="table-controls glass-panel">
              <div className="controls-left">
                <div className="search-box">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search by ID, resource, category, or description…"
                    value={ticketFilters.search}
                    onChange={e => setTicketFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="search-input"
                  />
                  {ticketFilters.search && (
                    <button className="search-clear" onClick={() => setTicketFilters(prev => ({ ...prev, search: '' }))}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>

                <div className="filter-group">
                  {['', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected'].map(s => (
                    <button
                      key={s || 'ALL'}
                      className={`filter-chip ${ticketFilters.status === s ? 'active' : ''}`}
                      onClick={() => setTicketFilters(prev => ({ ...prev, status: s }))}
                    >
                      {s || 'All Status'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="controls-right">
                <form onSubmit={applyTicketFilters} className="admin-ticket-filters-inline">
                  <select
                    className="role-select"
                    value={ticketFilters.priority}
                    onChange={e => setTicketFilters(prev => ({ ...prev, priority: e.target.value }))}
                    title="Priority"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>

                  <select
                    className="role-select"
                    value={ticketFilters.technicianId}
                    onChange={e => setTicketFilters(prev => ({ ...prev, technicianId: e.target.value }))}
                    title="Assigned Technician"
                  >
                    <option value="">All Technicians</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name || t.email}</option>
                    ))}
                  </select>

                  <button className="save-btn save-btn-active" type="submit" disabled={ticketsLoading}>
                    {ticketsLoading ? 'Loading…' : 'Apply'}
                  </button>
                  <button className="save-btn" type="button" onClick={clearTicketFilters} disabled={ticketsLoading}>
                    Clear
                  </button>
                </form>
              </div>
            </div>

            <div className="user-table-wrapper glass-panel">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Resource / Location</th>
                    <th>Category</th>
                    <th>Reporter</th>
                    <th>Technician</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsLoading ? (
                    <tr>
                      <td colSpan={9} className="empty-state">
                        <div className="loader" />
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-state">
                        <i className="bi bi-inbox"></i>
                        <p>No tickets match the selected filters.</p>
                      </td>
                    </tr>
                  ) : (
                    tickets.map(t => (
                      <tr key={t.id}>
                        <td><b>#{t.id}</b></td>
                        <td>
                          <span className={`ticket-badge ticket-status-${(t.status || '').toLowerCase().replaceAll(' ', '-')}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <span className={`ticket-badge ticket-priority-${(t.priority || '').toLowerCase()}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>{t.resourceOrLocation}</td>
                        <td>{t.category}</td>
                        <td>{t.user?.name || t.user?.email || '—'}</td>
                        <td>{t.assignedTechnician?.name || t.assignedTechnician?.email || 'Unassigned'}</td>
                        <td className="email-cell">{t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</td>
                        <td>
                          <button className="save-btn save-btn-active" onClick={() => navigate(`/tickets/${t.id}`)}>
                            View
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

        {/* ── FACILITY MANAGEMENT TAB ── */}
        {activeNav === 'resources' && (() => {
          // filtered list
          const filteredRes = resources.filter(r => {
            const matchType = resTypeFilter === 'ALL' || r.type === resTypeFilter;
            const matchStatus = resStatusFilter === 'ALL' || r.status === resStatusFilter;
            const q = resSearch.toLowerCase();
            const matchSearch = !q || r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
            return matchType && matchStatus && matchSearch;
          });
          const libCount = resources.filter(r => r.type === 'LIBRARY_SEAT').length;
          const labCount = resources.filter(r => r.type === 'LAB_STATION').length;
          const activeCount = resources.filter(r => r.status === 'ACTIVE').length;
          const maintCount = resources.filter(r => r.status !== 'ACTIVE').length;

          return (
            <section className="content-section animate-fade-in">
              <div className="section-heading">
                <h1>Facility Management</h1>
                <p>Manage library seats and computer lab stations. Quick-toggle status, edit inline, or add new resources.</p>
              </div>

              {/* ── Stats row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Resources', value: resources.length, icon: '🏛️', color: '#6366f1' },
                  { label: 'Library Seats', value: libCount, icon: '📚', color: '#818cf8' },
                  { label: 'Lab Stations', value: labCount, icon: '💻', color: '#34d399' },
                  { label: 'Under Maintenance', value: maintCount, icon: '🔧', color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 12 }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Add Resource form (collapsible card) ── */}
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-plus-circle-fill" style={{ color: '#22c55e' }}></i> Add New Resource
                </div>
                <form onSubmit={handleCreateResource} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '2 1 180px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Name (e.g. Seat L-101)</label>
                    <input type="text" className="search-input" placeholder="Resource name" value={newResource.name}
                      onChange={e => setNewResource(p => ({ ...p, name: e.target.value }))} required
                      style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: '2 1 180px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Location</label>
                    <input type="text" className="search-input" placeholder="e.g. Main Library - Floor 1" value={newResource.location}
                      onChange={e => setNewResource(p => ({ ...p, location: e.target.value }))} required
                      style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Type</label>
                    <select className="role-select" style={{ width: '100%' }} value={newResource.type}
                      onChange={e => setNewResource(p => ({ ...p, type: e.target.value }))}>
                      <option value="LIBRARY_SEAT">📚 Library Seat</option>
                      <option value="LAB_STATION">💻 Lab Station</option>
                    </select>
                  </div>
                  <button className="save-btn save-btn-active" type="submit" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-plus-lg"></i> Add Resource
                  </button>
                </form>
              </div>

              {/* ── Search & filter bar ── */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
                  <input type="text" className="search-input" placeholder="Search by name or location..."
                    value={resSearch} onChange={e => setResSearch(e.target.value)}
                    style={{ paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                {['ALL', 'LIBRARY_SEAT', 'LAB_STATION'].map(t => (
                  <button key={t} onClick={() => setResTypeFilter(t)}
                    className={`save-btn ${resTypeFilter === t ? 'save-btn-active' : ''}`}
                    style={{ fontSize: '0.76rem' }}>
                    {t === 'ALL' ? 'All Types' : t === 'LIBRARY_SEAT' ? '📚 Library' : '💻 Labs'}
                  </button>
                ))}
                {['ALL', 'ACTIVE', 'MAINTENANCE', 'UNAVAILABLE'].map(s => (
                  <button key={s} onClick={() => setResStatusFilter(s)}
                    className={`save-btn ${resStatusFilter === s ? 'save-btn-active' : ''}`}
                    style={{ fontSize: '0.76rem' }}>
                    {s === 'ALL' ? 'All Status' : s}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {filteredRes.length} of {resources.length} resources
                </span>
              </div>

              {/* ── Resource grid cards ── */}
              {resourcesLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}><div className="loader" /></div>
              ) : filteredRes.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 12 }}>
                  <i className="bi bi-building" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>No resources match your filters.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {filteredRes.map(r => {
                    const isEditing = editingResource === r.id;
                    const statusColor = r.status === 'ACTIVE' ? '#22c55e' : r.status === 'MAINTENANCE' ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={r.id} className="glass-panel" style={{
                        borderRadius: 12, padding: '1rem 1.25rem',
                        borderLeft: `3px solid ${statusColor}`,
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {r.type === 'LIBRARY_SEAT' ? '📚' : '💻'} {r.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.location}</div>
                          </div>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                            padding: '3px 8px', borderRadius: 20,
                            background: r.status === 'ACTIVE' ? 'rgba(34,197,94,0.12)' : r.status === 'MAINTENANCE' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                            color: statusColor, border: `1px solid ${statusColor}33`,
                          }}>{r.status}</span>
                        </div>

                        {/* Inline edit fields */}
                        {isEditing && (
                          <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input type="text" className="search-input" placeholder="Name"
                              value={editFields.name ?? r.name}
                              onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.82rem' }} />
                            <input type="text" className="search-input" placeholder="Location"
                              value={editFields.location ?? r.location}
                              onChange={e => setEditFields(p => ({ ...p, location: e.target.value }))}
                              style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.82rem' }} />
                          </div>
                        )}

                        {/* Status quick-toggle buttons */}
                        <div style={{ display: 'flex', gap: 5, marginBottom: '0.75rem' }}>
                          {['ACTIVE', 'MAINTENANCE', 'UNAVAILABLE'].map(s => (
                            <button key={s} onClick={() => {
                              if (r.status !== s) handleUpdateResourceStatus(r, s);
                            }}
                              style={{
                                flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                                background: r.status === s
                                  ? (s === 'ACTIVE' ? 'rgba(34,197,94,0.2)' : s === 'MAINTENANCE' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)')
                                  : 'rgba(255,255,255,0.04)',
                                color: r.status === s
                                  ? (s === 'ACTIVE' ? '#4ade80' : s === 'MAINTENANCE' ? '#fbbf24' : '#f87171')
                                  : 'var(--text-muted)',
                                border: r.status === s ? `1px solid ${statusColor}44` : '1px solid rgba(255,255,255,0.07)',
                              }}>
                              {s === 'ACTIVE' ? '✓' : s === 'MAINTENANCE' ? '🔧' : '✕'} {s.charAt(0)}
                            </button>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isEditing ? (
                            <>
                              <button className="save-btn save-btn-active" style={{ flex: 1, fontSize: '0.75rem' }}
                                onClick={async () => {
                                  try {
                                    const updated = await updateResource(r.id, { ...r, ...editFields });
                                    setResources(prev => prev.map(x => x.id === r.id ? updated : x));
                                    showNotification('Resource updated.', 'success');
                                  } catch { showNotification('Update failed.', 'error'); }
                                  setEditingResource(null); setEditFields({});
                                }}>
                                <i className="bi bi-check-lg"></i> Save
                              </button>
                              <button className="save-btn" style={{ flex: 1, fontSize: '0.75rem' }}
                                onClick={() => { setEditingResource(null); setEditFields({}); }}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="save-btn" style={{ flex: 1, fontSize: '0.75rem' }}
                                onClick={() => { setEditingResource(r.id); setEditFields({ name: r.name, location: r.location }); }}>
                                <i className="bi bi-pencil"></i> Edit
                              </button>
                              <button className="save-btn" style={{ flex: 1, fontSize: '0.75rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                onClick={() => handleDeleteResource(r.id)}>
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}

        {activeNav === 'reservations' && (() => {
          const filteredRes2 = reservations.filter(r => {
            const matchStatus = resFilter === 'ALL' || r.status === resFilter;
            const q = resUserSearch.toLowerCase();
            const matchUser = !q || (r.userName || '').toLowerCase().includes(q) || (r.userEmail || '').toLowerCase().includes(q) || (r.resourceName || '').toLowerCase().includes(q);
            return matchStatus && matchUser;
          });
          const totalActive = reservations.filter(r => r.status === 'CONFIRMED').length;
          const totalCancelled = reservations.filter(r => r.status === 'CANCELLED').length;
          return (
            <section className="content-section animate-fade-in">
              <div className="section-heading">
                <h1>All Reservations</h1>
                <p>Monitor and manage all seat and lab bookings across campus.</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Reservations', value: reservations.length, icon: '📋', color: '#6366f1' },
                  { label: 'Active Bookings', value: totalActive, icon: '✅', color: '#22c55e' },
                  { label: 'Cancelled', value: totalCancelled, icon: '❌', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: 12 }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}></i>
                  <input type="text" className="search-input" placeholder="Search user or resource..."
                    value={resUserSearch} onChange={e => setResUserSearch(e.target.value)}
                    style={{ paddingLeft: '30px', width: '100%', boxSizing: 'border-box' }} />
                </div>
                {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
                  <button key={s} onClick={() => setResFilter(s)}
                    className={`save-btn ${resFilter === s ? 'save-btn-active' : ''}`}
                    style={{ fontSize: '0.76rem' }}>
                    {s === 'ALL' ? 'All' : s === 'CONFIRMED' ? '✅ Active' : s === 'PENDING' ? '⏳ Pending' : s === 'COMPLETED' ? '✔ Completed' : '❌ Cancelled'}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {filteredRes2.length} reservations
                </span>
              </div>

              <div className="user-table-wrapper glass-panel">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Student</th>
                      <th>Date &amp; Slot</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservationsLoading ? (
                      <tr><td colSpan={6} className="empty-state"><div className="loader" /></td></tr>
                    ) : filteredRes2.length === 0 ? (
                      <tr><td colSpan={6} className="empty-state"><i className="bi bi-calendar-x"></i><p>No reservations found.</p></td></tr>
                    ) : (
                      filteredRes2.map(res => (
                        <tr key={res.id}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{res.resourceType === 'LIBRARY_SEAT' ? '📚' : '💻'} {res.resourceName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{res.resourceLocation}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{res.userName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{res.userEmail}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{res.reservationDate}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏰ {res.startTime?.substring(0, 5)} – {res.endTime?.substring(0, 5)}</div>
                          </td>
                          <td>
                            <span className={`role-badge ${res.resourceType === 'LIBRARY_SEAT' ? 'role-user' : 'role-technician'}`} style={{ fontSize: '0.65rem' }}>
                              {res.resourceType?.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                              padding: '3px 9px', borderRadius: 20,
                              background: res.status === 'CONFIRMED' ? 'rgba(34,197,94,0.12)'
                                : res.status === 'PENDING' ? 'rgba(245,158,11,0.12)'
                                : res.status === 'COMPLETED' ? 'rgba(148,163,184,0.12)'
                                : 'rgba(239,68,68,0.12)',
                              color: res.status === 'CONFIRMED' ? '#4ade80'
                                : res.status === 'PENDING' ? '#fbbf24'
                                : res.status === 'COMPLETED' ? '#94a3b8'
                                : '#f87171',
                              border: `1px solid ${
                                res.status === 'CONFIRMED' ? 'rgba(34,197,94,0.3)'
                                : res.status === 'PENDING' ? 'rgba(245,158,11,0.3)'
                                : res.status === 'COMPLETED' ? 'rgba(148,163,184,0.25)'
                                : 'rgba(239,68,68,0.3)'}`,
                            }}>
                              {res.status === 'PENDING' ? '⏳ PENDING'
                                : res.status === 'COMPLETED' ? '✔ COMPLETED'
                                : res.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {res.status === 'PENDING' && (
                                <button className="save-btn save-btn-active"
                                  style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                  onClick={() => handleAdminConfirmReservation(res.id)}>
                                  <i className="bi bi-check-circle"></i> Confirm
                                </button>
                              )}
                              {res.status !== 'CANCELLED' && (
                                <button className="save-btn"
                                  style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.75rem' }}
                                  onClick={() => handleAdminCancelReservation(res.id, res.resourceName, res.userName)}>
                                  <i className="bi bi-x-circle"></i> Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}

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
                  {['ALL', 'ADMIN', 'TECHNICIAN', 'USER'].map(r => (
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
                              <option value="TECHNICIAN">TECHNICIAN</option>
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
              <h1>Notification Center</h1>
              <p>Compose and broadcast notifications to students, admins, or all platform users.</p>
            </div>

            {/* ── Compose Panel ── */}
            <div className="notif-compose-layout">
              {/* Left: Form */}
              <div className="glass-panel notif-compose-card">
                <div className="notif-compose-header">
                  <i className="bi bi-pencil-square" style={{ color: '#a5b4fc', fontSize: '1.1rem' }}></i>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Compose Notification</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fill in the details and send instantly</p>
                  </div>
                </div>

                {notifStatus && (
                  <div className={`form-status-banner ${notifStatus.error ? 'status-error' : 'status-success'}`}>
                    <i className={`bi ${notifStatus.error ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
                    {notifStatus.message}
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setNotifStatus(null);
                  if (!notifMessage.trim()) return;
                  try {
                    await sendNotification({ message: notifMessage, type: notifType, target: notifTarget, expiresIn });
                    setNotifStatus({ error: false, message: '✅ Notification sent to ' + (notifTarget === 'ALL' ? 'all users' : notifTarget === 'USERS' ? 'students' : 'admins') + '!' });
                    setNotifMessage('');
                    const bList = await fetchNotificationBatches();
                    setBatches(bList);
                  } catch {
                    setNotifStatus({ error: true, message: 'Failed to send. Please try again.' });
                  }
                }} className="notification-form">

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-chat-left-text"></i> Message
                    </label>
                    <textarea
                      value={notifMessage}
                      onChange={e => setNotifMessage(e.target.value)}
                      placeholder="Write your announcement or alert here…"
                      required
                      className="notif-textarea"
                      rows="5"
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {notifMessage.length} characters
                    </span>
                  </div>

                  {/* Type chips */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-tag"></i> Type
                    </label>
                    <div className="notif-chip-row">
                      {[
                        { val: 'NOTIFICATION', icon: 'bi-bell', label: 'Standard', hint: 'Appears in bell dropdown' },
                        { val: 'ALERT', icon: 'bi-exclamation-octagon', label: 'Global Alert', hint: 'Sticky banner for all users' },
                      ].map(opt => (
                        <button key={opt.val} type="button"
                          className={`notif-type-chip ${notifType === opt.val ? 'chip-active' : ''}`}
                          onClick={() => setNotifType(opt.val)}
                        >
                          <i className={`bi ${opt.icon}`}></i>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{opt.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{opt.hint}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target chips */}
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-people"></i> Recipients
                    </label>
                    <div className="notif-chip-row">
                      {[
                        { val: 'ALL', icon: '🌐', label: 'Everyone', hint: 'All platform users' },
                        { val: 'USERS', icon: '🎓', label: 'Students', hint: 'Normal user accounts' },
                        { val: 'ADMINS', icon: '🛡️', label: 'Admins', hint: 'Admin accounts only' },
                      ].map(opt => (
                        <button key={opt.val} type="button"
                          className={`notif-type-chip ${notifTarget === opt.val ? 'chip-active chip-target' : ''}`}
                          onClick={() => setNotifTarget(opt.val)}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{opt.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{opt.hint}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiry select */}
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <i className="bi bi-clock-history"></i> Auto-expires after:
                    </label>
                    <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)} className="notif-select" style={{ width: 'auto' }}>
                      <option value="NEVER">Never (manual delete)</option>
                      <option value="1HR">1 Hour</option>
                      <option value="12HR">12 Hours</option>
                      <option value="1DAY">1 Day</option>
                      <option value="3DAY">3 Days</option>
                      <option value="7DAY">7 Days</option>
                    </select>
                  </div>

                  <button type="submit" className="send-notif-btn" disabled={!notifMessage.trim()}>
                    <i className="bi bi-send-fill"></i> Send to {notifTarget === 'ALL' ? 'All Users' : notifTarget === 'USERS' ? 'Students' : 'Admins'}
                  </button>
                </form>
              </div>

              {/* Right: Live Preview */}
              <div className="glass-panel notif-preview-card">
                <div className="notif-compose-header">
                  <i className="bi bi-eye" style={{ color: '#a5b4fc', fontSize: '1.1rem' }}></i>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Preview</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>How it will appear to users</p>
                  </div>
                </div>
                <div className="notif-preview-box" style={{
                  background: notifType === 'ALERT' ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${notifType === 'ALERT' ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
                  borderRadius: 12, padding: '1rem 1.1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '1.1rem' }}>{notifType === 'ALERT' ? '🚨' : '🔔'}</span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                      padding: '2px 8px', borderRadius: 20,
                      background: notifType === 'ALERT' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                      color: notifType === 'ALERT' ? '#f87171' : '#a5b4fc',
                    }}>{notifType === 'ALERT' ? 'Alert' : 'Notification'}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Just now</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: notifMessage ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.55, fontStyle: notifMessage ? 'normal' : 'italic' }}>
                    {notifMessage || 'Your message will appear here…'}
                  </p>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Delivery summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { label: 'Recipients', value: notifTarget === 'ALL' ? 'All Users' : notifTarget === 'USERS' ? 'Students Only' : 'Admins Only' },
                      { label: 'Type', value: notifType === 'ALERT' ? 'Global Alert Banner' : 'Bell Notification' },
                      { label: 'Expires', value: expiresIn === 'NEVER' ? 'Never (manual delete)' : `After ${expiresIn.replace('HR', ' hour(s)').replace('DAY', ' day(s)')}` },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Active Broadcasts ── */}
            <div className="section-heading" style={{ marginTop: '2rem' }}>
              <h2>Active Broadcasts</h2>
              <p>Currently live notifications. Delete a batch to remove it from all user inboxes immediately.</p>
            </div>

            {batches.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <i className="bi bi-broadcast" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No active broadcasts right now.</p>
                <span style={{ fontSize: '0.78rem', color: '#334155' }}>Notifications you send above will appear here.</span>
              </div>
            ) : (
              <div className="notif-batch-grid">
                {batches.map(b => (
                  <div key={b.batchId} className={`notif-batch-card glass-panel ${b.type === 'ALERT' ? 'batch-alert' : 'batch-notif'}`}>
                    <div className="batch-card-top">
                      <span className="batch-type-badge">
                        {b.type === 'ALERT' ? '🚨 Alert' : '🔔 Notification'}
                      </span>
                      <span className="batch-reach">{b.count} users</span>
                    </div>
                    <p className="batch-message">{b.message}</p>
                    <div className="batch-meta">
                      <span><i className="bi bi-send"></i> {new Date(b.createdAt).toLocaleString()}</span>
                      <span><i className="bi bi-clock"></i> {b.expiresAt ? `Expires ${new Date(b.expiresAt).toLocaleDateString()}` : 'Never expires'}</span>
                    </div>
                    <button className="delete-batch-btn" style={{ width: '100%', marginTop: '0.4rem' }}
                      onClick={() => handleDeleteBatch(b.batchId)}>
                      <i className="bi bi-trash-fill"></i> Delete Broadcast
                    </button>
                  </div>
                ))}
              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

