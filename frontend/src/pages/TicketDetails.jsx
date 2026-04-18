import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTicketById } from '../api/api';
import { useNotifications } from '../context/NotificationContext';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import './TicketDetails.css';

export default function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  useEffect(() => {
    const loadTicket = async () => {
      setLoading(true);
      try {
        const data = await fetchTicketById(id);
        setTicket(data);
      } catch (err) {
        showNotification('Unable to load ticket details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  if (loading) {
    return (
      <div className="ticket-details-page">
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-details-page">
        <button className="back-btn" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={18} /> Back to tickets
        </button>
        <div className="empty-state">
          <p>Ticket details could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-details-page">
      <div className="details-header">
        <button className="back-btn" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={18} /> Back to tickets
        </button>
        <div>
          <h2>Ticket #{ticket.id}</h2>
          <p className="details-subtitle">{ticket.resourceOrLocation} · {ticket.category}</p>
        </div>
      </div>

      <div className="details-grid">
        <section className="details-card glass-panel">
          <div className="details-card-header">
            <h3>Ticket Summary</h3>
            <span className="badge" style={{ backgroundColor: ticket.status === 'Open' ? '#3b82f6' : ticket.status === 'In Progress' ? '#f59e0b' : ticket.status === 'Resolved' ? '#10b981' : '#6b7280' }}>
              {ticket.status}
            </span>
          </div>

          <div className="details-row">
            <div>
              <span className="label">Priority</span>
              <p>{ticket.priority}</p>
            </div>
            <div>
              <span className="label">Created</span>
              <p>{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="details-block">
            <span className="label">Description</span>
            <p>{ticket.description}</p>
          </div>

          <div className="details-row">
            <div>
              <span className="label">Contact</span>
              <p>{ticket.contactDetails}</p>
            </div>
            <div>
              <span className="label">Reported By</span>
              <p>{ticket.user?.name || ticket.user?.email || 'Unknown'}</p>
            </div>
          </div>

          <div className="details-row">
            <div>
              <span className="label">Assigned Technician</span>
              <p>{ticket.assignedTechnician?.name || 'Unassigned'}</p>
            </div>
            <div>
              <span className="label">Resolution Notes</span>
              <p>{ticket.resolutionNotes || 'No resolution notes available.'}</p>
            </div>
          </div>
        </section>

        <section className="details-card glass-panel">
          <h3>Evidence & Comments</h3>

          {ticket.imageUrls && ticket.imageUrls.length > 0 ? (
            <div className="image-gallery">
              {ticket.imageUrls.map((url, idx) => (
                <a key={idx} href={`http://localhost:8080${url}`} target="_blank" rel="noreferrer" className="image-card">
                  <img src={`http://localhost:8080${url}`} alt={`Evidence ${idx + 1}`} />
                  <span>Evidence {idx + 1}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="empty-note">No evidence images uploaded.</p>
          )}

          <div className="comments-block">
            <h4>Comments</h4>
            {ticket.comments && ticket.comments.length > 0 ? (
              <ul>
                {ticket.comments.map((comment, idx) => (
                  <li key={idx}>{comment}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-note">No comments added yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
