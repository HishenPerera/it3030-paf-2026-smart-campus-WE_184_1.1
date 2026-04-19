import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchResources, fetchMyReservations, fetchAvailability, createReservation, cancelReservation } from '../api/api';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import NotificationBell from '../components/NotificationBell';
import { ArrowLeft, Calendar, Clock, RefreshCw, CheckCircle2, XCircle, BookOpen, Monitor, ClipboardList, AlertCircle } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const chunk = (arr, size) => {
  const rows = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
};

// ── Seat cell ────────────────────────────────────────────────────────────────
const SeatCell = React.memo(({ resource, state, onClick }) => {
  const num = resource.name.replace(/[^\d]/g, '').padStart(3, '0');
  const isClickable = state === 'available' || state === 'selected';

  const styles = {
    available: { bg: 'rgba(30,41,59,0.7)', border: '#334155', text: '#94a3b8', shadow: 'none' },
    selected:  { bg: 'rgba(34,197,94,0.18)', border: '#22c55e', text: '#4ade80', shadow: '0 0 10px rgba(34,197,94,0.3)' },
    booked:    { bg: 'rgba(239,68,68,0.1)',  border: '#7f1d1d', text: '#6b2d2d', shadow: 'none' },
    mine:      { bg: 'rgba(59,130,246,0.18)', border: '#3b82f6', text: '#60a5fa', shadow: '0 0 8px rgba(59,130,246,0.3)' },
    inactive:  { bg: 'rgba(15,20,30,0.5)',   border: '#1e293b', text: '#1e293b', shadow: 'none' },
  };

  const s = styles[state] || styles.available;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      title={isClickable ? `${resource.name} · ${resource.location} — Click to ${state === 'selected' ? 'deselect' : 'select'}` : `${resource.name} — ${state === 'booked' ? 'Already booked' : state === 'mine' ? 'Your reservation' : 'Unavailable'}`}
      style={{
        width: 42, height: 42, borderRadius: 8, cursor: isClickable ? 'pointer' : 'default',
        border: `1.5px solid ${s.border}`, background: s.bg, boxShadow: s.shadow,
        color: s.text, fontSize: '0.6rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.14s ease', flexShrink: 0, outline: 'none', padding: 0,
        fontFamily: 'monospace',
        transform: state === 'selected' ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      {state === 'booked' ? '✕' : state === 'mine' ? '★' : num}
    </button>
  );
});

// ── Table cluster (4 seats around a table) ───────────────────────────────────
const TableCluster = ({ seats, getSeatState, toggleSeat, tableNum, type }) => {
  // seats around a rectangular table: top-left, top-right, bottom-left, bottom-right
  const [a, b, c, d] = seats;
  const tableColor = type === 'LIBRARY_SEAT' ? '#1a2535' : '#0f1e1a';
  const tableBorder = type === 'LIBRARY_SEAT' ? '#243047' : '#143028';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Top seats */}
      <div style={{ display: 'flex', gap: 4 }}>
        {a && <SeatCell resource={a} state={getSeatState(a)} onClick={() => toggleSeat(a.id)} />}
        {b && <SeatCell resource={b} state={getSeatState(b)} onClick={() => toggleSeat(b.id)} />}
      </div>
      {/* Table */}
      <div style={{
        width: 92, height: 28, borderRadius: 6,
        background: tableColor, border: `1px solid ${tableBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.55rem', color: '#334155', letterSpacing: '0.05em',
      }}>
        TBL {String(tableNum).padStart(2, '0')}
      </div>
      {/* Bottom seats */}
      <div style={{ display: 'flex', gap: 4 }}>
        {c && <SeatCell resource={c} state={getSeatState(c)} onClick={() => toggleSeat(c.id)} />}
        {d && <SeatCell resource={d} state={getSeatState(d)} onClick={() => toggleSeat(d.id)} />}
      </div>
    </div>
  );
};

// ── Lab row (stations in a line) ─────────────────────────────────────────────
const LabRow = ({ seats, getSeatState, toggleSeat, rowLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: '0.65rem', color: '#1e4d3a', fontWeight: 700, width: 20, textAlign: 'right', flexShrink: 0 }}>
      {rowLabel}
    </span>
    <div style={{
      display: 'flex', gap: 6, padding: '6px 12px', borderRadius: 8,
      background: 'rgba(10,30,22,0.6)', border: '1px solid rgba(16,185,129,0.08)',
    }}>
      {seats.map(r => (
        <SeatCell key={r.id} resource={r} state={getSeatState(r)} onClick={() => toggleSeat(r.id)} />
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function ResourceBooking() {
  const [allResources, setAllResources] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [bookedIds, setBookedIds] = useState(new Set());
  const [mySlotIds, setMySlotIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tab, setTab] = useState('LIBRARY_SEAT');
  const [floorTab, setFloorTab] = useState(0);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [showMyRes, setShowMyRes] = useState(false);

  // Cancel reason modal
  const [cancelModal, setCancelModal] = useState(null); // { id, resourceName }
  const [cancelReason, setCancelReason] = useState('');

  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  const timer = useRef(null);

  const loadBase = useCallback(async () => {
    try {
      setLoadingResources(true); setError(null);
      const [res, mine] = await Promise.all([fetchResources(), fetchMyReservations()]);
      setAllResources(Array.isArray(res) ? res : []);
      setMyReservations(Array.isArray(mine) ? mine : []);
    } catch { setError('Could not load resources. Please try again.'); }
    finally { setLoadingResources(false); }
  }, []);

  const loadAvail = useCallback(async (date, st, et) => {
    if (!date || !st || !et || st >= et) return;
    try {
      setLoadingAvail(true);
      const ids = await fetchAvailability(date, st + ':00', et + ':00');
      setBookedIds(new Set(ids));
      setSelectedIds(new Set());
    } catch { setBookedIds(new Set()); }
    finally { setLoadingAvail(false); }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => loadAvail(selectedDate, startTime, endTime), 400);
    return () => clearTimeout(timer.current);
  }, [selectedDate, startTime, endTime, loadAvail]);

  // my reservations for this exact slot
  useEffect(() => {
    const ids = new Set(
      myReservations
        .filter(r =>
          r.status !== 'CANCELLED' &&
          r.reservationDate === selectedDate &&
          r.startTime?.substring(0, 5) === startTime &&
          r.endTime?.substring(0, 5) === endTime
        )
        .map(r => r.resourceId)
    );
    setMySlotIds(ids);
  }, [myReservations, selectedDate, startTime, endTime]);

  const toggleSeat = useCallback((id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const getSeatState = useCallback((resource) => {
    if (resource.status !== 'ACTIVE') return 'inactive';
    if (mySlotIds.has(resource.id)) return 'mine';
    if (bookedIds.has(resource.id)) return 'booked';
    if (selectedIds.has(resource.id)) return 'selected';
    return 'available';
  }, [mySlotIds, bookedIds, selectedIds]);

  const handleBook = async () => {
    if (selectedIds.size === 0) { showNotification('Please select at least one seat.', 'error'); return; }
    if (startTime >= endTime) { showNotification('End time must be after start time.', 'error'); return; }
    setBooking(true);
    let ok = 0; const errs = [];
    for (const id of selectedIds) {
      try {
        await createReservation({ resourceId: id, reservationDate: selectedDate, startTime: startTime + ':00', endTime: endTime + ':00' });
        ok++;
      } catch (e) { errs.push(e.response?.data?.message || 'Booking failed'); }
    }
    setBooking(false);
    if (ok > 0) showNotification(`✅ ${ok} seat${ok > 1 ? 's' : ''} reserved successfully!`, 'success');
    if (errs.length > 0) showNotification(errs[0], 'error');
    setSelectedIds(new Set());
    await loadBase();
    await loadAvail(selectedDate, startTime, endTime);
  };

  const handleCancel = (id, resourceName) => {
    setCancelModal({ id, resourceName });
    setCancelReason('');
  };

  const doCancel = async () => {
    if (!cancelModal) return;
    try {
      await cancelReservation(cancelModal.id, cancelReason);
      showNotification('Reservation cancelled.', 'info');
      setCancelModal(null);
      await loadBase();
      await loadAvail(selectedDate, startTime, endTime);
    } catch { showNotification('Failed to cancel.', 'error'); }
  };

  // Resources for current tab / section
  const libFloors = [
    allResources.filter(r => r.type === 'LIBRARY_SEAT' && r.location.includes('Floor 1')),
    allResources.filter(r => r.type === 'LIBRARY_SEAT' && r.location.includes('Floor 2')),
  ];
  const labSections = [
    allResources.filter(r => r.type === 'LAB_STATION' && r.location.includes('Lab A')),
    allResources.filter(r => r.type === 'LAB_STATION' && r.location.includes('Lab B')),
  ];

  const currentSeats = tab === 'LIBRARY_SEAT' ? libFloors[floorTab] : labSections[floorTab];
  const libTables = chunk(currentSeats, 4); // 4 seats per table cluster
  const labRows = chunk(currentSeats, 8);   // 8 stations per row

  const tabSeats = tab === 'LIBRARY_SEAT'
    ? [...libFloors[0], ...libFloors[1]]
    : [...labSections[0], ...labSections[1]];

  const avail = tabSeats.filter(r => getSeatState(r) === 'available').length;
  const taken = tabSeats.filter(r => ['booked', 'mine'].includes(getSeatState(r))).length;
  const selectedList = allResources.filter(r => selectedIds.has(r.id));

  const isLib = tab === 'LIBRARY_SEAT';
  const accent = isLib ? '#818cf8' : '#34d399';
  const accentBg = isLib ? 'rgba(99,102,241,0.15)' : 'rgba(52,211,153,0.12)';
  const accentBorder = isLib ? 'rgba(99,102,241,0.3)' : 'rgba(52,211,153,0.25)';

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Cancel Reason Modal ── */}
      {cancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0f1829', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '2rem', width: 360, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <AlertCircle size={20} style={{ color: '#ef4444' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Cancel Reservation</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Cancelling: <strong style={{ color: '#e2e8f0' }}>{cancelModal.resourceName}</strong>
            </p>
            <label style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Reason (optional)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Change of plans, scheduling conflict..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: '0.83rem',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
              <button onClick={doCancel} style={{
                flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              }}>Yes, Cancel Booking</button>
              <button onClick={() => setCancelModal(null)} style={{
                flex: 1, padding: '9px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem',
              }}>Keep Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: 'rgba(11,17,32,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
          }}><ArrowLeft size={16} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
              {isLib ? '📚 Library Seat Booking' : '💻 Computer Lab Booking'}
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#475569' }}>Select your preferred seat on the floor plan below</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setShowMyRes(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
            background: showMyRes ? accentBg : 'rgba(255,255,255,0.04)', border: `1px solid ${showMyRes ? accentBorder : 'rgba(255,255,255,0.08)'}`,
            color: showMyRes ? accent : '#64748b', fontSize: '0.78rem', fontWeight: 600,
          }}>
            <ClipboardList size={13} />
            My Reservations
            {myReservations.filter(r => r.status !== 'CANCELLED').length > 0 && (
              <span style={{ background: accent, color: '#0b1120', borderRadius: 20, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 800 }}>
                {myReservations.filter(r => r.status !== 'CANCELLED').length}
              </span>
            )}
          </button>
          <button onClick={() => { loadBase(); loadAvail(selectedDate, startTime, endTime); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#475569',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem',
          }}>
            <RefreshCw size={13} style={{ animation: (loadingResources || loadingAvail) ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <NotificationBell />
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ══ Left: Floor Plan ═══════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* Facility tab switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
            {[
              { key: 'LIBRARY_SEAT', icon: <BookOpen size={14} />, label: 'Library' },
              { key: 'LAB_STATION',  icon: <Monitor size={14} />,  label: 'Computer Labs' },
            ].map(({ key, icon, label }) => (
              <button key={key} onClick={() => { setTab(key); setFloorTab(0); setSelectedIds(new Set()); }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                border: tab === key ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.05)',
                background: tab === key ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: tab === key ? '#f1f5f9' : '#475569', transition: 'all 0.12s',
              }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* ── Slot picker & stats bar ── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
            padding: '0.85rem 1rem', marginBottom: '1.25rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} />
              <input type="date" value={selectedDate} min={today}
                onChange={e => setSelectedDate(e.target.value)} style={fieldStyle} />
            </label>
            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} />
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={fieldStyle} />
              <span style={{ color: '#334155' }}>–</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={fieldStyle} />
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
              <span style={{ color: '#34d399' }}>● {avail} available</span>
              <span style={{ color: '#ef4444' }}>● {taken} taken</span>
              {loadingAvail && <span style={{ color: '#64748b' }}>updating...</span>}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Available', color: '#334155', border: '#334155' },
              { label: 'Selected', color: 'rgba(34,197,94,0.18)', border: '#22c55e' },
              { label: 'Booked', color: 'rgba(239,68,68,0.1)', border: '#7f1d1d' },
              { label: 'Your booking', color: 'rgba(59,130,246,0.18)', border: '#3b82f6' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#64748b' }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color, border: `1.5px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem' }}>
              <XCircle size={14} /> {error}
            </div>
          )}

          {/* ── Zone tabs (Floor / Lab section) ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
            {(isLib ? ['Floor 1', 'Floor 2'] : ['Lab A', 'Lab B']).map((label, i) => (
              <button key={i} onClick={() => { setFloorTab(i); setSelectedIds(new Set()); }} style={{
                padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                border: floorTab === i ? `1px solid ${accentBorder}` : '1px solid rgba(255,255,255,0.06)',
                background: floorTab === i ? accentBg : 'transparent',
                color: floorTab === i ? accent : '#475569', transition: 'all 0.12s',
              }}>
                {label}
              </button>
            ))}
          </div>

          {loadingResources ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: '#334155' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #1e293b', borderTop: `3px solid ${accent}`, borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              Loading floor plan...
            </div>
          ) : isLib ? (
            /* ── Library: Table clusters ── */
            <div>
              {/* Zone label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem',
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <BookOpen size={16} style={{ color: '#818cf8' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {floorTab === 0 ? 'Ground Floor — Silent Study Zone' : 'First Floor — Group Study Zone'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                    {floorTab === 0 ? 'L-001 to L-050 · Individual & paired desks · Quiet zone enforced' : 'L-051 to L-100 · Group tables · Collaborative discussion allowed'}
                  </div>
                </div>
              </div>

              {/* Entrance indicator */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'inline-block', padding: '5px 32px',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#334155', background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0 0 20px 20px',
                }}>
                  ↑ ENTRANCE / EXIT ↑
                </div>
              </div>

              {/* Table clusters in a room-like grid */}
              <div style={{
                background: 'rgba(15,22,38,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16, padding: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '2rem',
              }}>
                {libTables.map((seats, i) => (
                  <TableCluster
                    key={i}
                    seats={seats}
                    getSeatState={getSeatState}
                    toggleSeat={toggleSeat}
                    tableNum={i + 1}
                    type="LIBRARY_SEAT"
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ── Lab: Row-based stations ── */
            <div>
              {/* Zone label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem',
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.1)',
              }}>
                <Monitor size={16} style={{ color: '#34d399' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {floorTab === 0 ? 'Lab A — IT Building, Level 1' : 'Lab B — IT Building, Level 2'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                    {floorTab === 0 ? 'C-001 to C-025 · Standard workstations · Windows 11 · MS Office' : 'C-026 to C-050 · Development workstations · Linux / Windows Dual Boot'}
                  </div>
                </div>
              </div>

              {/* Instructor desk */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  padding: '8px 40px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1e4d3a',
                  background: 'rgba(15,30,22,0.8)', border: '1px solid rgba(16,185,129,0.12)',
                }}>
                  INSTRUCTOR DESK
                </div>
              </div>

              {/* Station rows */}
              <div style={{
                background: 'rgba(10,20,16,0.6)', border: '1px solid rgba(16,185,129,0.07)',
                borderRadius: 16, padding: '2rem',
                display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start',
              }}>
                {labRows.map((row, ri) => (
                  <LabRow
                    key={ri}
                    seats={row}
                    getSeatState={getSeatState}
                    toggleSeat={toggleSeat}
                    rowLabel={String.fromCharCode(65 + ri)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ Right: Booking Panel ════════════════════════════════════════════ */}
        <div style={{
          width: 280, flexShrink: 0, overflowY: 'auto',
          background: 'rgba(8,13,26,0.8)', borderLeft: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Booking summary */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 0.9rem 0', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Selected Seats
            </h3>

            {selectedIds.size === 0 ? (
              <div style={{
                padding: '1.5rem', textAlign: 'center', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🪑</div>
                <p style={{ color: '#334155', fontSize: '0.78rem', margin: 0 }}>Click any green seat on the floor plan to select it</p>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedList.map(r => (
                    <div key={r.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '7px 10px', borderRadius: 8,
                      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80' }}>{r.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#334155' }}>{r.location}</div>
                      </div>
                      <button onClick={() => toggleSeat(r.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '1rem', lineHeight: 1, padding: '2px 4px',
                      }}>×</button>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.8 }}>
                  <div>📅 {selectedDate}</div>
                  <div>⏰ {startTime} – {endTime}</div>
                  <div>🪑 {selectedIds.size} seat{selectedIds.size !== 1 ? 's' : ''}</div>
                </div>

                <button onClick={handleBook} disabled={booking} style={{
                  width: '100%', padding: '10px', borderRadius: 9, border: 'none',
                  background: booking ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: booking ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)', marginBottom: 8,
                }}>
                  {booking ? '⏳ Confirming...' : `✓ Confirm ${selectedIds.size} Seat${selectedIds.size !== 1 ? 's' : ''}`}
                </button>
                <button onClick={() => setSelectedIds(new Set())} style={{
                  width: '100%', padding: '8px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.07)',
                  background: 'transparent', color: '#475569', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                }}>
                  Clear Selection
                </button>
              </>
            )}
          </div>

          {/* My Reservations drawer */}
          {showMyRes && (
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                My Reservations
              </h3>
              {myReservations.length === 0 ? (
                <p style={{ color: '#1e293b', fontSize: '0.78rem', textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>No reservations yet.</p>
              ) : myReservations.map(r => (
                <div key={r.id} style={{
                  padding: '10px 12px', borderRadius: 9, marginBottom: 8, fontSize: '0.75rem',
                  background: r.status === 'CANCELLED' ? 'rgba(239,68,68,0.05)' : r.status === 'PENDING' ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${r.status === 'CANCELLED' ? 'rgba(239,68,68,0.12)' : r.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: 2 }}>{r.resourceName}</div>
                  <div style={{ color: '#475569', marginBottom: 5, lineHeight: 1.6 }}>
                    {r.reservationDate}<br />
                    {r.startTime?.substring(0, 5)} – {r.endTime?.substring(0, 5)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: r.status === 'CANCELLED' ? '#ef4444' : r.status === 'PENDING' ? '#f59e0b' : '#22c55e',
                    }}>
                      {r.status === 'PENDING' ? '⏳ Pending' : r.status}
                    </span>
                    {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                      <button onClick={() => handleCancel(r.id, r.resourceName)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', color: '#f87171', cursor: 'pointer',
                      }}>{r.status === 'PENDING' ? 'Withdraw' : 'Cancel'}</button>
                    )}
                  </div>
                  {r.cancellationReason && (
                    <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                      Reason: {r.cancellationReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        input[type='date']::-webkit-calendar-picker-indicator,
        input[type='time']::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
      `}</style>
    </div>
  );
}

const fieldStyle = {
  background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 7, padding: '5px 9px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none',
};
