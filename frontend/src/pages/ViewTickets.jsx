import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTickets, fetchCurrentUser } from '../api/api';
import { useNotifications } from '../context/NotificationContext';
import { Filter, ArrowLeft, Image as ImageIcon, Search } from 'lucide-react';
import './ViewTickets.css';

export default function ViewTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('USER');
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    resource: '',
    date: ''
  });

  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await fetchCurrentUser();
        setUserRole(user.role || 'USER');
        await loadTickets();
      } catch (err) {
        showNotification('Failed to load tickets', 'error');
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadTickets = async (currentFilters = filters) => {
    setLoading(true);
    try {
      // Remove empty parameters
      const params = {};
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key]) {
          params[key] = currentFilters[key];
        }
      });
      
      const data = await fetchTickets(params);
      setTickets(data);
    } catch (err) {
      showNotification('Failed to fetch tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    loadTickets(filters);
  };

  const clearFilters = () => {
    const emptyFilters = { status: '', priority: '', category: '', resource: '', date: '' };
    setFilters(emptyFilters);
    loadTickets(emptyFilters);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'open': return 'var(--status-open, #3b82f6)';
      case 'in progress': return 'var(--status-progress, #f59e0b)';
      case 'resolved': return 'var(--status-resolved, #10b981)';
      case 'closed': return 'var(--status-closed, #6b7280)';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="view-tickets-container min-h-screen animate-fade-in">
      <div className="ticket-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
        <h2>{userRole === 'ADMIN' ? 'All System Tickets' : userRole === 'TECHNICIAN' ? 'My Assigned Tickets' : 'My Ticket History'}</h2>
      </div>

      <div className="filters-panel glass-panel">
        <div className="filters-header">
          <h3><Filter size={18} /> Filters</h3>
        </div>
        <form onSubmit={applyFilters} className="filters-form">
          <div className="filter-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <select name="priority" value={filters.priority} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Furniture">Furniture</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Resource / Location</label>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input type="text" name="resource" placeholder="Search..." value={filters.resource} onChange={handleFilterChange} />
            </div>
          </div>
          <div className="filter-group">
            <label>Date Created</label>
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />
          </div>
          <div className="filter-actions">
            <button type="button" className="btn-secondary" onClick={clearFilters}>Clear</button>
            <button type="submit" className="btn-primary">Apply Filters</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex-center mt-8">
          <div className="loader"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state glass-panel">
          <p>No tickets found matching your criteria.</p>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card glass-panel">
              <div className="ticket-card-header">
                <span className="ticket-id">#{ticket.id}</span>
                <span className="badge" style={{ backgroundColor: getStatusColor(ticket.status) }}>
                  {ticket.status}
                </span>
              </div>
              <div className="ticket-card-body">
                <h3 className="ticket-resource">{ticket.resourceOrLocation}</h3>
                <div className="ticket-meta-tags">
                  <span className="meta-tag">{ticket.category}</span>
                  <span className="meta-tag" style={{ borderLeft: `3px solid ${getPriorityColor(ticket.priority)}` }}>
                    Priority: {ticket.priority}
                  </span>
                </div>
                <p className="ticket-desc">{ticket.description}</p>
                <div className="ticket-info-grid">
                  <div className="info-item">
                    <span className="label">Contact:</span>
                    <span className="value">{ticket.contactDetails}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Technician:</span>
                    <span className="value">{ticket.assignedTechnician ? ticket.assignedTechnician.name : 'Unassigned'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Reporter:</span>
                    <span className="value">{ticket.user ? ticket.user.name : 'Unknown'}</span>
                  </div>
                </div>
                
                {ticket.imageUrls && ticket.imageUrls.length > 0 && (
                  <div className="ticket-images-section">
                    <span className="section-title"><ImageIcon size={14} /> Evidence Images</span>
                    <div className="ticket-thumbnails">
                      {ticket.imageUrls.map((url, idx) => (
                        <a key={idx} href={`http://localhost:8080${url}`} target="_blank" rel="noreferrer" className="thumbnail-link">
                          <img src={`http://localhost:8080${url}`} alt={`Evidence ${idx+1}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
