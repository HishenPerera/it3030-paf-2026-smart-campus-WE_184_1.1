import React, { useState, useEffect } from 'react';
import { fetchResources, addResource, updateResource, deleteResource } from '../api/api';
import {
    Search, Plus, Edit2, Trash2, X, Filter, LayoutGrid, MapPin, Users,
    CheckCircle2, XCircle, Box, Activity, AlertCircle, Sofa, Users2, Calendar, TrendingUp
} from 'lucide-react';
import './Resources.css';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + 2);
    const maxDate = maxDateObj.toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        type: 'Regular Seat',
        capacity: 1,
        location: 'Ground Floor',
        status: 'ACTIVE',
        date: today
    });
    const [errors, setErrors] = useState({});

    const isMaintenance = formData.status === 'OUT_OF_SERVICE';

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        try {
            const data = await fetchResources();
            setResources(data);
        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    // --- Member 1 Special Feature: User Analytics Logic ---
    const currentBooking = resources.find(r => r.date === today);
    const totalBookings = resources.length;

    // වැඩිපුරම භාවිතා කරන තට්ටුව සොයා ගැනීම
    const floorCounts = resources.reduce((acc, r) => {
        acc[r.location] = (acc[r.location] || 0) + 1;
        return acc;
    }, {});
    const favoriteFloor = Object.keys(floorCounts).reduce((a, b) => floorCounts[a] > floorCounts[b] ? a : b, 'N/A');
    // -----------------------------------------------------

    const isSeatRegistered = (seatId) => {
        return resources.some(r => r.name === seatId && r.id !== formData.id);
    };

    const generateSeatIds = (type, location) => {
        if (type === 'Discussion Room') {
            return Array.from({ length: 10 }, (_, i) => `DR-${String(i + 1).padStart(2, '0')}`);
        }
        const prefix = location === 'Ground Floor' ? 'G' : 'U';
        const startNum = location === 'Ground Floor' ? 1 : 51;
        return Array.from({ length: 50 }, (_, i) => `${prefix}-S${String(startNum + i).padStart(3, '0')}`);
    };

    const handleInputChange = (e) => {
        if (isMaintenance && e.target.name !== 'status') return;
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCategoryChange = (newType) => {
        if (isMaintenance) return;
        const newCapacity = newType === 'Discussion Room' ? 5 : 1;
        setFormData({
            ...formData,
            type: newType,
            capacity: newCapacity,
            name: ''
        });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name) newErrors.name = 'Please select a seat from the map';
        if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = 'Capacity is required';
        if (!formData.date) newErrors.date = 'Date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenModal = (resource = null) => {
        if (resource) {
            setFormData({ ...resource, date: resource.date || today });
        } else {
            setFormData({ id: null, name: '', type: 'Regular Seat', capacity: 1, location: 'Ground Floor', status: 'ACTIVE', date: today });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            if (formData.id) {
                await updateResource(formData.id, formData);
            } else {
                await addResource(formData);
            }
            handleCloseModal();
            loadResources();
        } catch (error) {
            console.error('Error saving resource:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this resource?')) {
            try {
                await deleteResource(id);
                loadResources();
            } catch (error) {
                console.error('Error deleting resource:', error);
            }
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesSearch = res.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType ? res.type === filterType : true;
        return matchesSearch && matchesType;
    });

    return (
        <div className="resources-container min-h-screen animate-fade-in">
            <main className="resources-main">
                {/* Header */}
                <div className="resources-header glass-panel">
                    <div className="header-title-section">
                        <div className="header-icon-wrapper"><TrendingUp size={28} className="text-primary-icon" /></div>
                        <div>
                            <h2>My Library Workspace</h2>
                            <p className="header-subtitle">Manage your seat bookings and preferences</p>
                        </div>
                    </div>
                    <button className="btn-add" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> <span>Book New Seat</span>
                    </button>
                </div>

                {/* --- Innovation Feature: User Analytics Dashboard --- */}
                <div className="user-analytics-grid">
                    <div className="analytics-card glass-panel blue-accent">
                        <div className="analytics-icon"><Sofa size={24} /></div>
                        <div className="analytics-info">
                            <span className="label">Current Booking</span>
                            <span className="value">{currentBooking ? `${currentBooking.name}` : 'No booking today'}</span>
                        </div>
                    </div>
                    <div className="analytics-card glass-panel green-accent">
                        <div className="analytics-icon"><MapPin size={24} /></div>
                        <div className="analytics-info">
                            <span className="label">Favorite Floor</span>
                            <span className="value">{favoriteFloor}</span>
                        </div>
                    </div>
                    <div className="analytics-card glass-panel gold-accent">
                        <div className="analytics-icon"><Activity size={24} /></div>
                        <div className="analytics-info">
                            <span className="label">Total Library Visits</span>
                            <span className="value">{totalBookings} times</span>
                        </div>
                    </div>
                </div>

                <div className="resources-controls">
                    <div className="search-wrapper">
                        <Search size={18} className="input-icon" />
                        <input type="text" placeholder="Search by ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                    </div>
                </div>

                {/* Data Table */}
                <div className="resources-table-wrapper glass-panel">
                    <table className="resources-table">
                        <thead>
                            <tr>
                                <th>Seat ID</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Location</th>
                                <th>Effective Date</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResources.map(resource => (
                                <tr key={resource.id}>
                                    <td className="font-medium">{resource.name}</td>
                                    <td><span className="type-badge">{resource.type}</span></td>
                                    <td>{resource.capacity}</td>
                                    <td>{resource.location}</td>
                                    <td>{resource.date || 'N/A'}</td>
                                    <td>
                                        <span className={`status-pill ${resource.status === 'ACTIVE' ? 'status-active-pill' : 'status-inactive-pill'}`}>
                                            {resource.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleOpenModal(resource)}><Edit2 size={16} /></button>
                                            <button className="btn-icon-delete" onClick={() => handleDelete(resource.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal Form */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className={`modal-content glass-panel library-modal ${isMaintenance ? 'mode-maintenance' : ''}`}>
                            <div className="modal-header">
                                <h3>{formData.id ? 'Modify Booking' : 'Seat Booking'}</h3>
                                <button onClick={handleCloseModal} className="btn-close"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                {isMaintenance && (
                                    <div className="maintenance-warning animate-shake">
                                        <AlertCircle size={18} /> <span>Under maintenance. Details are locked.</span>
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <div className={`segmented-control ${isMaintenance ? 'disabled-control' : ''}`}>
                                            <button type="button" disabled={isMaintenance} className={`segment-btn ${formData.type === 'Regular Seat' ? 'active' : ''}`} onClick={() => handleCategoryChange('Regular Seat')}>
                                                <Sofa size={16} /> Seat (1)
                                            </button>
                                            <button type="button" disabled={isMaintenance} className={`segment-btn ${formData.type === 'Discussion Room' ? 'active' : ''}`} onClick={() => handleCategoryChange('Discussion Room')}>
                                                <Users2 size={16} /> Room (5)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Floor</label>
                                        <div className={`segmented-control ${isMaintenance ? 'disabled-control' : ''}`}>
                                            <button type="button" disabled={isMaintenance} className={`segment-btn ${formData.location === 'Ground Floor' ? 'active' : ''}`} onClick={() => !isMaintenance && setFormData({ ...formData, location: 'Ground Floor', name: '' })}>G-Floor</button>
                                            <button type="button" disabled={isMaintenance} className={`segment-btn ${formData.location === 'Upstairs' ? 'active' : ''}`} onClick={() => !isMaintenance && setFormData({ ...formData, location: 'Upstairs', name: '' })}>Upstairs</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="seat-map-section">
                                    <div className="seat-map-header">
                                        <label>Interactive Map {formData.name && <span className="selected-tag">Selected: {formData.name}</span>}</label>
                                    </div>
                                    <div className={`interactive-grid ${isMaintenance ? 'grid-locked' : ''}`}>
                                        {generateSeatIds(formData.type, formData.location).map(seatId => {
                                            const registered = isSeatRegistered(seatId);
                                            return (
                                                <button key={seatId} type="button" disabled={isMaintenance || (registered && !formData.id)} className={`map-seat ${formData.name === seatId ? 'selected' : ''} ${registered ? 'registered' : 'available'}`} onClick={() => !isMaintenance && setFormData({ ...formData, name: seatId })}>
                                                    {formData.type === 'Discussion Room' ? <Users2 size={14} /> : <Sofa size={14} />}
                                                    <span>{seatId}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>

                                <div className="form-group full-width mt-4">
                                    <label>Booking Date</label>
                                    <div className="input-with-icon">
                                        <Calendar size={16} className="field-icon" />
                                        <input type="date" name="date" min={today} max={maxDate} disabled={isMaintenance} value={formData.date} onChange={handleInputChange} className={`date-input ${isMaintenance ? 'input-locked' : ''}`} />
                                    </div>
                                    {errors.date && <span className="error-text">{errors.date}</span>}
                                </div>

                                <div className="form-row form-row-spacing">
                                    <div className="form-group">
                                        <label>Capacity (Auto Header)</label>
                                        <div className="input-with-icon" style={{ opacity: 0.85 }}>
                                            <Users size={16} className="field-icon" style={{ color: '#64748b' }} />
                                            <input 
                                                type="number" 
                                                value={formData.capacity} 
                                                readOnly 
                                                className="readonly-input locked-solid-input"
                                                style={{ 
                                                    cursor: 'not-allowed', 
                                                    background: 'rgba(30, 41, 59, 0.6)', 
                                                    color: '#94a3b8',
                                                    borderColor: 'rgba(255, 255, 255, 0.05)'
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Operational Status</label>
                                        <div className="segmented-control">
                                            <button type="button" className={`segment-btn ${formData.status === 'ACTIVE' ? 'active-success' : ''}`} onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}>
                                                <CheckCircle2 size={16} /> Active
                                            </button>
                                            <button type="button" className={`segment-btn ${formData.status === 'OUT_OF_SERVICE' ? 'active-danger' : ''}`} onClick={() => setFormData({ ...formData, status: 'OUT_OF_SERVICE' })}>
                                                <AlertCircle size={16} /> Maintenance
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={handleCloseModal} className="btn-cancel">Cancel</button>
                                    <button type="submit" className="btn-save" disabled={isMaintenance && formData.id}>
                                        {formData.id ? 'Update Booking' : 'Confirm Booking'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Resources;