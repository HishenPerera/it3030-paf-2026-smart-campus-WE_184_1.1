import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchTicketById, fetchCurrentUser, updateTicketStatus, fetchTechnicians, assignTechnician, deleteTicketAttachment, fetchComments, addComment, updateComment, deleteComment } from '../api/api';
import { useNotifications } from '../context/NotificationContext';
import { ArrowLeft, Image as ImageIcon, Edit2, Trash2, MessageSquare, Send } from 'lucide-react';
import './TicketDetails.css';

const STATUS_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
  Rejected: []
};

export default function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('USER');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ticketData, currentUser, ticketComments] = await Promise.all([
          fetchTicketById(id),
          fetchCurrentUser(),
          fetchComments(id)
        ]);
        setTicket(ticketData);
        setUserRole(currentUser.role || 'USER');
        setCurrentUserId(currentUser.id || null);
        setComments(ticketComments);

        if (currentUser.role === 'ADMIN') {
          const techs = await fetchTechnicians();
          setTechnicians(techs);
        }
      } catch (err) {
        showNotification('Unable to load ticket details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const canUpdateStatus = () => {
    if (!ticket) return false;
    if (ticket.status === 'Closed' || ticket.status === 'Rejected') return false;
    return userRole === 'TECHNICIAN' || userRole === 'ADMIN';
  };

  const availableStatusOptions = () => {
    if (!ticket) return [];
    const next = STATUS_TRANSITIONS[ticket.status] || [];
    if (userRole === 'ADMIN') {
      // Admin can reject from any active state and close a resolved ticket
      const opts = new Set([...next, 'Rejected']);
      return Array.from(opts);
    }
    // Technicians should not be able to close tickets; only resolve them
    if (userRole === 'TECHNICIAN') {
      return next.filter(s => s !== 'Closed' && s !== 'Rejected');
    }
    return [];
  };

  const submitStatusUpdate = async () => {
    if (!selectedStatus) {
      showNotification('Please select a valid status.', 'error');
      return;
    }
    if (selectedStatus === 'Rejected' && !rejectionReason.trim()) {
      showNotification('Please enter a rejection reason.', 'error');
      return;
    }
    if (selectedStatus === 'Resolved' && !resolutionNotes.trim()) {
      showNotification('Please enter resolution notes.', 'error');
      return;
    }

    setUpdating(true);
    try {
      const payload = { status: selectedStatus };
      if (selectedStatus === 'Rejected') {
        payload.rejectionReason = rejectionReason;
      } else if (selectedStatus === 'Resolved') {
        payload.resolutionNotes = resolutionNotes;
      }
      const updated = await updateTicketStatus(id, payload);
      setTicket(updated);
      setSelectedStatus('');
      setRejectionReason('');
      setResolutionNotes('');
      showNotification('Ticket status updated successfully.', 'success');
    } catch (err) {
      showNotification('Failed to update ticket status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const submitTechnicianAssignment = async () => {
    const technicianId = selectedTechnician && selectedTechnician !== 'NONE' ? parseInt(selectedTechnician) : null;

    setAssigning(true);
    try {
      const updated = await assignTechnician(id, technicianId);
      setTicket(updated);
      setSelectedTechnician('');
      showNotification('Technician assigned successfully.', 'success');
    } catch (err) {
      showNotification('Failed to assign technician.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showNotification('Please enter a comment.', 'error');
      return;
    }

    setCommentLoading(true);
    try {
      const comment = await addComment(id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      showNotification('Comment added successfully.', 'success');
    } catch (err) {
      showNotification('Failed to add comment.', 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editCommentContent.trim()) {
      showNotification('Please enter comment content.', 'error');
      return;
    }

    setCommentLoading(true);
    try {
      const updated = await updateComment(id, editingComment, editCommentContent.trim());
      setComments(prev => prev.map(c => c.id === editingComment ? updated : c));
      setEditingComment(null);
      setEditCommentContent('');
      showNotification('Comment updated successfully.', 'success');
    } catch (err) {
      showNotification('Failed to update comment.', 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setCommentLoading(true);
    try {
      await deleteComment(id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      showNotification('Comment deleted successfully.', 'success');
    } catch (err) {
      showNotification('Failed to delete comment.', 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteAttachment = async (imageUrl) => {
    if (!confirm('Delete this evidence image?')) {
      return;
    }
    setDeletingAttachment(imageUrl);
    try {
      const updated = await deleteTicketAttachment(id, imageUrl);
      setTicket(updated);
      showNotification('Attachment removed successfully.', 'success');
    } catch (err) {
      showNotification('Failed to remove attachment.', 'error');
    } finally {
      setDeletingAttachment('');
    }
  };

  const canModifyComment = (comment) => {
    if (!comment?.author?.id) return false;
    return comment.author.id === currentUserId || userRole === 'ADMIN';
  };

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
            <span className="badge" style={{ backgroundColor: ticket.status === 'Open' ? '#3b82f6' : ticket.status === 'In Progress' ? '#f59e0b' : ticket.status === 'Resolved' ? '#10b981' : ticket.status === 'Rejected' ? '#ef4444' : '#6b7280' }}>
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

          {ticket.status === 'Rejected' && (
            <div className="details-row">
              <div>
                <span className="label">Rejection Reason</span>
                <p>{ticket.rejectionReason || 'No rejection reason provided.'}</p>
              </div>
            </div>
          )}

          {canUpdateStatus() && (
            <div className="status-update-panel">
              <h4>Update Ticket Status</h4>
              <div className="form-row">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">Select status</option>
                  {availableStatusOptions().map(statusOption => (
                    <option key={statusOption} value={statusOption}>{statusOption}</option>
                  ))}
                </select>
              </div>

              {selectedStatus === 'Rejected' && (
                <div className="form-row">
                  <label>Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="Enter rejection reason"
                  />
                </div>
              )}

              {selectedStatus === 'Resolved' && (
                <div className="form-row">
                  <label>Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    placeholder="Enter resolution notes (e.g., 'Projector bulb replaced' or 'Network cable repaired')"
                  />
                </div>
              )}

              <button className="btn-primary" onClick={submitStatusUpdate} disabled={updating || !selectedStatus}>
                {updating ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          )}

          {userRole === 'ADMIN' && (
            <div className="technician-assignment-panel">
              <h4>Assign Technician</h4>
              <div className="form-row">
                <select value={selectedTechnician} onChange={(e) => setSelectedTechnician(e.target.value)}>
                  <option value="">Select technician</option>
                  <option value="NONE">Unassign</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name || tech.email}</option>
                  ))}
                </select>
              </div>
              <button className="btn-primary" onClick={submitTechnicianAssignment} disabled={assigning}>
                {assigning ? 'Assigning…' : 'Assign Technician'}
              </button>
            </div>
          )}
        </section>

        <section className="details-card glass-panel">
          <h3>Evidence & Comments</h3>

          {ticket.imageUrls && ticket.imageUrls.length > 0 ? (
            <div className="image-gallery">
              {ticket.imageUrls.map((url, idx) => (
                <div key={idx} className="attachment-card">
                  <a href={`http://localhost:8080${url}`} target="_blank" rel="noreferrer" className="image-card">
                    <img src={`http://localhost:8080${url}`} alt={`Evidence ${idx + 1}`} />
                    <span>Evidence {idx + 1}</span>
                  </a>
                  <button
                    type="button"
                    className="delete-image-btn"
                    onClick={() => handleDeleteAttachment(url)}
                    disabled={deletingAttachment === url}
                  >
                    {deletingAttachment === url ? 'Removing…' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">No evidence images uploaded.</p>
          )}

          <div className="comments-section">
            <h4><MessageSquare size={18} /> Comments</h4>

            {/* Add new comment */}
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                disabled={commentLoading}
              />
              <button
                className="btn-primary comment-btn"
                onClick={handleAddComment}
                disabled={commentLoading || !newComment.trim()}
              >
                <Send size={16} />
                {commentLoading ? 'Adding...' : 'Add Comment'}
              </button>
            </div>

            {/* Display comments */}
            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-author">
                        <strong>{comment.author?.name || comment.author?.email || 'Unknown'}</strong>
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="comment-edited">(edited)</span>
                        )}
                      </div>
                      {canModifyComment(comment) && (
                        <div className="comment-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditComment(comment)}
                            disabled={commentLoading}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={commentLoading}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingComment === comment.id ? (
                      <div className="edit-comment">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          rows={3}
                          disabled={commentLoading}
                        />
                        <div className="edit-actions">
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setEditingComment(null);
                              setEditCommentContent('');
                            }}
                            disabled={commentLoading}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-primary"
                            onClick={handleUpdateComment}
                            disabled={commentLoading || !editCommentContent.trim()}
                          >
                            {commentLoading ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="comment-content">
                        {comment.content}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-note">No comments yet. Be the first to add one!</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
