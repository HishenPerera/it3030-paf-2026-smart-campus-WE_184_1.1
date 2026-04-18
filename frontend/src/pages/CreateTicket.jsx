import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/api';
import { UploadCloud, X, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './CreateTicket.css';

export default function CreateTicket() {
  const [formData, setFormData] = useState({
    resourceOrLocation: '',
    category: '',
    description: '',
    priority: 'Low',
    contactDetails: ''
  });
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateAndAppendFiles = (selectedFiles) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const maxSize = 5 * 1024 * 1024;

    if (files.length + selectedFiles.length > 3) {
      showNotification('You can only upload up to 3 images as evidence', 'error');
      return;
    }

    const validatedFiles = [];
    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        showNotification(`Invalid file type: ${file.name}. Use PNG, JPG or GIF.`, 'error');
        continue;
      }
      if (file.size > maxSize) {
        showNotification(`File too large: ${file.name}. Max 5MB per image.`, 'error');
        continue;
      }
      validatedFiles.push(file);
    }

    setFiles(prev => [...prev, ...validatedFiles].slice(0, 3));
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndAppendFiles(selectedFiles);
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    setDragging(false);
    const selectedFiles = Array.from(e.dataTransfer.files || []);
    validateAndAppendFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length > 3) {
      showNotification('Maximum 3 files allowed', 'error');
      return;
    }
    if (!formData.resourceOrLocation.trim() || !formData.category || !formData.description.trim() || !formData.contactDetails.trim()) {
      showNotification('Please fill all required fields before submitting.', 'error');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('resourceOrLocation', formData.resourceOrLocation);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('priority', formData.priority);
    data.append('contactDetails', formData.contactDetails);
    
    files.forEach(file => {
      data.append('files', file);
    });

    try {
      await createTicket(data);
      setSuccess(true);
      setTimeout(() => {
         navigate('/dashboard');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit ticket';
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="create-ticket-container min-h-screen animate-fade-in flex-center">
        <div className="success-panel glass-panel">
          <CheckCircle2 size={64} className="success-icon" />
          <h2>Ticket Submitted!</h2>
          <p>Your maintenance ticket has been reported successfully. Our team will review it shortly.</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-ticket-container min-h-screen animate-fade-in">
      <div className="ticket-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
        <div>
          <h2>Report Incident</h2>
          <p className="ticket-subtitle">Submit a maintenance or incident report with optional photo evidence (max 3 images).</p>
        </div>
      </div>

      <main className="form-wrapper glass-panel">
        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label>Resource / Location</label>
            <input 
              type="text" 
              name="resourceOrLocation" 
              placeholder="e.g., Computing Lab 4, Canteen..." 
              value={formData.resourceOrLocation} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="" disabled>Select category</option>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Furniture">Furniture</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleInputChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description of Issue</label>
            <textarea 
              name="description" 
              placeholder="Please describe the problem in detail..." 
              rows="4" 
              value={formData.description} 
              onChange={handleInputChange} 
              required 
            ></textarea>
          </div>

          <div className="form-group">
            <label>Preferred Contact Details</label>
            <input 
              type="text" 
              name="contactDetails" 
              placeholder="Phone number, MS Teams handle..." 
              value={formData.contactDetails} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="upload-section">
            <label>Evidence Images (Max 3)</label>
            
            <div
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDrop={onDropFiles}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            >
              <UploadCloud size={32} />
              <p>Click to browse or drag & drop images</p>
              <span>PNG, JPG, JPEG, GIF · Max 5MB each · {files.length}/3 selected</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png,image/jpeg,image/jpg,image/gif" 
                multiple 
                style={{display: 'none'}} 
              />
            </div>
            
            {files.length > 0 && (
              <div className="file-preview-list">
                {files.map((file, idx) => (
                  <div key={idx} className="file-chip">
                    <img src={URL.createObjectURL(file)} alt="preview" />
                    <span>{file.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="submit-ticket-btn" disabled={loading}>
            {loading ? <div className="loader small"></div> : 'Submit Ticket'}
          </button>
        </form>
      </main>
    </div>
  );
}
