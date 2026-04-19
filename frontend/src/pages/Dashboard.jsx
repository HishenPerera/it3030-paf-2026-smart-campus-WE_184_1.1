import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, fetchDashboardStats, logout, createTicket } from '../api/api';
import NotificationBell from '../components/NotificationBell';
import useNotifications from '../context/useNotifications';
import {
  UploadCloud, X, CheckCircle2, AlertTriangle, ArrowRight, Ticket, Wrench,
  Bell, BarChart3, Clock, Zap, Shield, BookOpen, Monitor, ClipboardList,
  Users, Send, Settings, ChevronRight, Star, TrendingUp, Activity
} from 'lucide-react';
import './Dashboard.css';

/* ─── Incident Modal ──────────────────────────────────────── */
function IncidentModal({ onClose, onSuccess, showNotification }) {
  const [formData, setFormData] = useState({ resourceOrLocation: '', category: '', description: '', priority: 'Medium', contactDetails: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = React.useRef(null);
  const handleInput = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const addFiles = selected => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (files.length + selected.length > 3) { showNotification('Max 3 images.', 'error'); return; }
    const valid = selected.filter(f => {
      if (!allowed.includes(f.type)) { showNotification(`Invalid: ${f.name}`, 'error'); return false; }
      if (f.size > 5 * 1024 * 1024) { showNotification(`Too large: ${f.name}`, 'error'); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, 3));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.resourceOrLocation.trim() || !formData.category || !formData.description.trim() || !formData.contactDetails.trim()) {
      showNotification('Fill all required fields.', 'error'); return;
    }
    setLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    files.forEach(f => data.append('files', f));
    try {
      await createTicket(data);
      showNotification('Incident reported! Our team will review shortly.', 'success');
      onSuccess();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed.', 'error');
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel glass-panel animate-fade-in">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-wrap"><AlertTriangle size={20} /></div>
            <div><h3>Report an Incident</h3><p>Submit a maintenance or campus issue</p></div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-body">
            <div className="mf-group mf-full">
              <label>Resource / Location *</label>
              <input type="text" name="resourceOrLocation" placeholder="e.g., Computing Lab 4, Main Canteen…" value={formData.resourceOrLocation} onChange={handleInput} required />
            </div>
            <div className="mf-row">
              <div className="mf-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleInput} required>
                  <option value="" disabled>Select category</option>
                  <option>IT Equipment</option><option>Electrical</option><option>Plumbing</option>
                  <option>Furniture</option><option>Cleaning</option><option>Other</option>
                </select>
              </div>
              <div className="mf-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleInput}>
                  <option value="Low">🟢 Low</option><option value="Medium">🟡 Medium</option>
                  <option value="High">🟠 High</option><option value="Critical">🔴 Critical</option>
                </select>
              </div>
            </div>
            <div className="mf-group mf-full">
              <label>Description *</label>
              <textarea name="description" rows={3} placeholder="Describe the problem…" value={formData.description} onChange={handleInput} required />
            </div>
            <div className="mf-group mf-full">
              <label>Contact Details *</label>
              <input type="text" name="contactDetails" placeholder="Phone / MS Teams handle…" value={formData.contactDetails} onChange={handleInput} required />
            </div>
            <div className="mf-group mf-full">
              <label>Evidence <span className="optional-tag">(optional, max 3)</span></label>
              <div className={`upload-drop ${dragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files || [])); }}
              >
                <UploadCloud size={22} />
                <span>Click or drag &amp; drop images</span>
                <span className="upload-hint">PNG, JPG, GIF · Max 5MB · {files.length}/3</span>
                <input type="file" ref={fileInputRef} onChange={e => addFiles(Array.from(e.target.files || []))} accept="image/*" multiple style={{ display: 'none' }} />
              </div>
              {files.length > 0 && (
                <div className="file-chips">
                  {files.map((f, i) => (
                    <div key={i} className="file-chip">
                      <img src={URL.createObjectURL(f)} alt="preview" />
                      <span>{f.name}</span>
                      <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="mf-cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="mf-submit-btn" disabled={loading}>
              {loading ? <span className="loader-sm" /> : <><AlertTriangle size={16} /> Submit Report</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Role Guide Steps ──────────────────────────────────────── */
const ROLE_GUIDE = {
  USER: [
    { icon: '🪑', title: 'Book a Campus Facility', desc: 'Select a date and time slot, pick your library seat or computer lab station, and confirm your reservation instantly.', action: 'Book a Seat', color: '#22c55e' },
    { icon: '📋', title: 'Report a Campus Issue', desc: 'Spotted a broken fixture, faulty equipment or a cleaning problem? Submit a ticket and our team is notified immediately.', action: 'Report Incident', color: '#6366f1' },
    { icon: '🔍', title: 'Track Your Tickets', desc: 'Follow the progress of your submitted reports — from Open → In Progress → Resolved.', action: 'My Tickets', color: '#3b82f6' },
    { icon: '🔔', title: 'Stay Updated', desc: 'Booking confirmations, admin cancellations, and campus alerts appear in your notification bell.', color: '#f59e0b' },
  ],
  ADMIN: [
    { icon: '📊', title: 'Monitor Overview', desc: 'Track open tickets, high-priority issues, and resolution metrics from the overview.', action: 'View Overview', color: '#6366f1' },
    { icon: '✅', title: 'Approve Bookings', desc: 'Review pending seat reservations and confirm or cancel them in All Reservations.', action: 'All Reservations', color: '#22c55e' },
    { icon: '🏛️', title: 'Manage Facilities', desc: 'Add, edit, or change the status of library seats and lab stations.', action: 'Facility Management', color: '#3b82f6' },
    { icon: '📢', title: 'Broadcast Alerts', desc: 'Send notifications or alerts to all users, students, or admins via Send Notifications.', action: 'Send Notification', color: '#f59e0b' },
  ],
  TECHNICIAN: [
    { icon: '🔧', title: 'View Assigned Tickets', desc: 'Go to My Tickets to see all maintenance tasks assigned to you.', action: 'My Tickets', color: '#6366f1' },
    { icon: '📝', title: 'Update Ticket Status', desc: 'Open a ticket and update its progress — In Progress, Resolved, or Closed.', action: 'My Tickets', color: '#22c55e' },
    { icon: '📸', title: 'Add Evidence', desc: 'Upload photos of completed repairs as evidence in the ticket details.', color: '#3b82f6' },
    { icon: '🔔', title: 'Stay Notified', desc: 'New assignments and admin messages appear in your notification bell.', color: '#f59e0b' },
  ],
};

const ROLE_SHORTCUTS = {
  USER: [
    { icon: <BookOpen size={22} />, label: 'Book Campus Facility', hint: 'Library seats & computer labs', color: '#22c55e', key: 'booking' },
    { icon: <Ticket size={22} />, label: 'My Bookings', hint: 'View & manage your reservations', color: '#3b82f6', key: 'tickets' },
    { icon: <AlertTriangle size={22} />, label: 'Report Issue', hint: 'Submit a maintenance ticket', color: '#6366f1', key: 'report' },
    { icon: <Bell size={22} />, label: 'Notifications', hint: 'Campus announcements & alerts', color: '#f59e0b', key: 'notifs' },
  ],
  ADMIN: [
    { icon: <BarChart3 size={22} />, label: 'Overview', hint: 'Stats & open tickets', color: '#6366f1', key: 'overview' },
    { icon: <CheckCircle2 size={22} />, label: 'All Reservations', hint: 'Approve or cancel bookings', color: '#22c55e', key: 'reservations' },
    { icon: <Settings size={22} />, label: 'Facility Management', hint: 'Manage seats & labs', color: '#3b82f6', key: 'resources' },
    { icon: <Users size={22} />, label: 'User Management', hint: 'Roles & accounts', color: '#8b5cf6', key: 'users' },
    { icon: <Send size={22} />, label: 'Send Notification', hint: 'Broadcast to students', color: '#f59e0b', key: 'notifications' },
    { icon: <Wrench size={22} />, label: 'Tickets', hint: 'All campus support tickets', color: '#ef4444', key: 'tickets' },
  ],
  TECHNICIAN: [
    { icon: <Wrench size={22} />, label: 'My Tickets', hint: 'View assigned work orders', color: '#6366f1', key: 'tickets' },
    { icon: <Activity size={22} />, label: 'Update Progress', hint: 'Change ticket status', color: '#22c55e', key: 'tickets' },
    { icon: <Monitor size={22} />, label: 'Schedule Check', hint: 'Review lab availability', color: '#3b82f6', key: 'booking' },
    { icon: <Bell size={22} />, label: 'Notifications', hint: 'New assignments & alerts', color: '#f59e0b', key: 'notifs' },
  ],
};

/* ─── Stat Card ─────────────────────────────── */
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className={`dash-stat-card glass-panel dash-stat-${color}`}>
      <div className="dsc-icon">{icon}</div>
      <div className="dsc-body">
        <span className="dsc-value">{value ?? '—'}</span>
        <span className="dsc-label">{label}</span>
        {sub && <span className="dsc-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────── */
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const navigate = useNavigate();
  const { normalNotifications, showNotification } = useNotifications();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    finally { setUser(null); navigate('/login'); }
  };

  useEffect(() => {
    fetchCurrentUser()
      .then(d => setUser(d))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    fetchDashboardStats().then(d => setStats(d)).catch(() => { });
  }, []);

  const handleIncidentSuccess = useCallback(() => {
    setShowModal(false); setSuccessFlash(true);
    setTimeout(() => setSuccessFlash(false), 4000);
    fetchDashboardStats().then(d => setStats(d)).catch(() => { });
  }, []);

  const handleShortcut = (key, role) => {
    if (key === 'report') { setShowModal(true); return; }
    if (key === 'tickets') { navigate('/tickets'); return; }
    if (key === 'booking') { navigate('/booking'); return; }
    if (key === 'notifs') { return; } // open bell
    if (['overview', 'reservations', 'resources', 'users', 'notifications', 'tickets'].includes(key)) {
      navigate('/admin', { state: { tab: key } });
    }
  };

  if (loading) return <div className="dashboard-container min-h-screen flex-center"><div className="loader" /></div>;
  if (!user) return null;

  const role = user.role || 'USER';
  const recentNotifs = (normalNotifications || []).slice(0, 4);
  const guide = ROLE_GUIDE[role] || ROLE_GUIDE.USER;
  const shortcuts = ROLE_SHORTCUTS[role] || ROLE_SHORTCUTS.USER;

  const roleLabel = role === 'USER' ? 'Student' : role === 'TECHNICIAN' ? 'Technician' : 'Administrator';
  const roleColor = role === 'ADMIN' ? '#fbbf24' : role === 'TECHNICIAN' ? '#34d399' : '#a5b4fc';

  return (
    <div className="dashboard-container min-h-screen animate-fade-in">

      {/* ── Topbar ── */}
      <header className="dashboard-header glass-panel">
        <div className="header-brand">
          <div className="brand-logo">
            <img src="../public/favicon.ico" alt="Smart Campus Logo" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => { e.target.src = '/favicon.ico'; }} />
          </div>
          <div>
            <h2>SLIIT Smart Campus</h2>
            <span className="brand-sub">Facility Management Portal</span>
          </div>
        </div>
        <div className="header-profile">
          <NotificationBell />
          <img
            src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6366f1&color=fff`}
            alt="Avatar" className="avatar"
          />
          <div className="profile-info">
            <span className="profile-name">{user.name || user.email}</span>
            <span className={`profile-role role-chip-${role.toLowerCase()}`}>{roleLabel}</span>
          </div>
          {(role === 'ADMIN' || role === 'TECHNICIAN') && (
            <button className="admin-btn" onClick={() => navigate('/admin')}>
              {role === 'ADMIN' ? 'Admin Panel' : 'Technician Panel'}
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">

        {successFlash && (
          <div className="success-flash animate-fade-in">
            <CheckCircle2 size={18} /> Incident reported! Our team will review it shortly.
          </div>
        )}

        {/* ── Welcome Banner ── */}
        <section className="welcome-banner glass-panel" style={{
          background: `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.8) 100%)`,
          borderLeft: `4px solid ${roleColor}`,
        }}>
          <div className="wb-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '3px 12px', borderRadius: 20, background: `${roleColor}22`, color: roleColor,
                border: `1px solid ${roleColor}44`
              }}>{roleLabel} Portal</span>
            </div>
            <h1>Welcome back, {user.name?.split(' ')[0] || 'User'} 👋</h1>
            <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              {role === 'ADMIN'
                ? 'Full platform access · Manage tickets, approve bookings, and broadcast notifications.'
                : role === 'TECHNICIAN'
                  ? 'View your assigned maintenance tickets, update progress, and mark jobs complete.'
                  : 'Report campus issues, book a library or lab seat, and track your support tickets.'}
            </p>
            {role === 'USER' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="cta-report-btn" style={{ background: 'linear-gradient(135deg,#166534,#15803d)', borderColor: 'rgba(34,197,94,0.5)', color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }} onClick={() => navigate('/booking')}>
                  <BookOpen size={16} /> Book a Facility
                </button>
                <button className="cta-report-btn" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5', boxShadow: 'none' }} onClick={() => setShowModal(true)}>
                  <AlertTriangle size={16} /> Report Issue
                </button>
              </div>
            )}
            {role === 'ADMIN' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="cta-report-btn" onClick={() => navigate('/admin', { state: { tab: 'reservations' } })}>
                  <CheckCircle2 size={16} /> Review Reservations
                </button>
                <button className="cta-report-btn" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }} onClick={() => navigate('/admin', { state: { tab: 'notifications' } })}>
                  <Send size={16} /> Send Notification
                </button>
              </div>
            )}
            {role === 'TECHNICIAN' && (
              <button className="cta-report-btn" style={{ marginTop: 14 }} onClick={() => navigate('/tickets')}>
                <Wrench size={16} /> View Assigned Tickets
              </button>
            )}
          </div>
          <div className="wb-illustration">
            <div className="wb-circle wb-circle-1" />
            <div className="wb-circle wb-circle-2" />
            <div className="wb-circle wb-circle-3" />
            {role === 'ADMIN' ? <Shield size={64} className="wb-icon" strokeWidth={1.2} />
              : role === 'TECHNICIAN' ? <Wrench size={64} className="wb-icon" strokeWidth={1.2} />
                : <BookOpen size={64} className="wb-icon" strokeWidth={1.2} />}
          </div>
        </section>

        {/* ── Stats Row (admin/ticket stats) ── */}
        {stats && (
          <div className="stats-row">
            <StatCard icon={<Ticket size={22} />} label="Open Tickets" value={stats.openTickets} color="blue" sub="Awaiting action" />
            <StatCard icon={<Zap size={22} />} label="In Progress" value={stats.inProgressTickets} color="amber" sub="Being worked on" />
            <StatCard icon={<CheckCircle2 size={22} />} label="Resolved" value={stats.resolvedTickets} color="green" sub="Completed" />
            <StatCard icon={<AlertTriangle size={22} />} label="High Priority" value={stats.highPriorityTickets} color="red" sub="Needs attention" />
            {stats.averageResolutionTime && stats.averageResolutionTime !== 'N/A' && (
              <StatCard icon={<Clock size={22} />} label="Avg Resolution" value={stats.averageResolutionTime} color="purple" sub="Resolution time" />
            )}
          </div>
        )}

        {/* ── USER: Primary Booking Hero + Secondary Report Card ── */}
        {role === 'USER' && (
          <div className="user-hero-grid">
            {/* PRIMARY: Book a Facility */}
            <div className="user-hero-primary glass-panel">
              <div className="uhp-badge">⭐ Primary Action</div>
              <div className="uhp-icon-wrap">
                <BookOpen size={36} strokeWidth={1.5} />
              </div>
              <h2 className="uhp-title">Book a Campus Facility</h2>
              <p className="uhp-desc">
                Reserve a <strong>library study seat</strong> or <strong>computer lab station</strong> for your session.
                Choose your date, time slot, and confirm — it's that simple.
              </p>
              <ul className="uhp-bullets">
                <li>📚 Silent Study Zone — Library floor plan seats</li>
                <li>💻 Computer Lab — Themed row-by-row stations</li>
                <li>⏳ Booking confirmed once admin approves</li>
                <li>🔔 Get notified by confirmation or cancellation</li>
              </ul>
              <button className="uhp-cta-btn" onClick={() => navigate('/booking')}>
                <BookOpen size={18} /> Browse & Book Now
              </button>
            </div>

            {/* SECONDARY: Report Issue + My Tickets stacked */}
            <div className="user-secondary-stack">
              <button className="user-secondary-card glass-panel" onClick={() => setShowModal(true)}>
                <div className="usc-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}>
                  <AlertTriangle size={22} />
                </div>
                <div className="usc-body">
                  <span className="usc-title">Report a Campus Issue</span>
                  <span className="usc-hint">Broken equipment, electrical faults, cleaning requests…</span>
                </div>
                <ChevronRight size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
              </button>

              <button className="user-secondary-card glass-panel" onClick={() => navigate('/tickets')}>
                <div className="usc-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}>
                  <Ticket size={22} />
                </div>
                <div className="usc-body">
                  <span className="usc-title">My Tickets & Bookings</span>
                  <span className="usc-hint">Track submitted reports and reservation status</span>
                </div>
                <ChevronRight size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
              </button>

              <button className="user-secondary-card glass-panel" onClick={() => navigate('/booking')}>
                <div className="usc-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}>
                  <Clock size={22} />
                </div>
                <div className="usc-body">
                  <span className="usc-title">My Active Reservations</span>
                  <span className="usc-hint">View pending & confirmed seat bookings</span>
                </div>
                <ChevronRight size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
              </button>
            </div>
          </div>
        )}
        <section className="dash-section">
          <div className="dash-section-title">
            <Zap size={16} /> Quick Actions
          </div>
          <div className="shortcuts-grid">
            {shortcuts.map((s, i) => (
              <button key={i} className="shortcut-card glass-panel" onClick={() => handleShortcut(s.key, role)}
                style={{ '--accent': s.color }}>
                <div className="sc-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                <div className="sc-text">
                  <span className="sc-label">{s.label}</span>
                  <span className="sc-hint">{s.hint}</span>
                </div>
                <ChevronRight size={16} className="sc-arrow" style={{ color: s.color }} />
              </button>
            ))}
          </div>
        </section>

        {/* ── How to Use Guide ── */}
        <div className="dash-grid">
          <section className="dash-card glass-panel">
            <h3 className="dash-card-title">
              <Star size={17} /> {roleLabel} Guide — How to Use
            </h3>
            <div className="guide-steps">
              {guide.map((step, i) => (
                <div key={i} className="guide-step">
                  <div className="gs-number" style={{ background: `${step.color}1a`, color: step.color, border: `1px solid ${step.color}33` }}>
                    {i + 1}
                  </div>
                  <div className="gs-icon">{step.icon}</div>
                  <div className="gs-body">
                    <div className="gs-title">{step.title}</div>
                    <div className="gs-desc">{step.desc}</div>
                  </div>
                  {step.action && (
                    <button className="gs-action" style={{ color: step.color, borderColor: `${step.color}33` }}
                      onClick={() => handleShortcut(
                        step.action === 'Report Incident' ? 'report' :
                          step.action === 'My Tickets' ? 'tickets' :
                            step.action === 'Book a Seat' ? 'booking' :
                              step.action === 'View Overview' ? 'overview' :
                                step.action === 'All Reservations' ? 'reservations' :
                                  step.action === 'Facility Management' ? 'resources' :
                                    step.action === 'User Management' ? 'users' :
                                      step.action === 'Send Notification' ? 'notifications' : 'tickets'
                      )}>
                      {step.action} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Recent Notifications */}
          <section className="dash-card glass-panel">
            <h3 className="dash-card-title">
              <Bell size={17} /> Recent Notifications
            </h3>
            {recentNotifs.length === 0 ? (
              <div className="empty-notifs">
                <Bell size={28} strokeWidth={1.2} />
                <p>No new notifications</p>
                <span style={{ fontSize: '0.75rem', color: '#334155' }}>You're all caught up!</span>
              </div>
            ) : (
              <div className="notif-list">
                {recentNotifs.map(n => {
                  const isUnread = n.isRead !== true && n.read !== true;
                  return (
                    <div key={n.id} className={`notif-item ${isUnread ? 'notif-unread' : ''}`}>
                      <div className={`notif-dot ${isUnread ? 'dot-active' : ''}`} />
                      <div className="notif-body">
                        <p>{n.message}</p>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {recentNotifs.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569', cursor: 'pointer' }}>Click the 🔔 bell above to see all</span>
              </div>
            )}
          </section>
        </div>

      </main>

      {showModal && (
        <IncidentModal onClose={() => setShowModal(false)} onSuccess={handleIncidentSuccess} showNotification={showNotification} />
      )}
    </div>
  );
}
