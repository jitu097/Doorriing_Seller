
import React, { useState, useEffect } from 'react';
import './Offers.css';
import groceryService from '../../services/groceryService';

const Offers = () => {
    const [activeTab, setActiveTab] = useState('is_active'); // 'is_active' (true/false) or 'all'
    const [offers, setOffers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        discount_type: 'percentage', // percentage or fixed
        discount_value: '',
        min_order_amount: '',
        valid_until: '',
        usage_limit: ''
    });

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const data = await groceryService.getOffers();
            setOffers(data || []);
        } catch (error) {
            console.error("Failed to fetch offers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await groceryService.createOffer(formData);
            setShowCreateForm(false);
            setFormData({
                code: '',
                name: '',
                discount_type: 'percentage',
                discount_value: '',
                min_order_amount: '',
                valid_until: '',
                usage_limit: ''
            });
            fetchOffers(); // Refresh list
        } catch (error) {
            alert("Failed to create offer: " + (error.message || "Unknown error"));
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await groceryService.toggleOffer(id, !currentStatus);
            fetchOffers();
        } catch (error) {
            console.error("Failed to toggle offer", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this offer?")) return;
        try {
            await groceryService.deleteOffer(id);
            fetchOffers();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    // Filter logic
    const filteredOffers = offers.filter(offer => {
        if (activeTab === 'all') return true;
        if (activeTab === 'is_active') return offer.is_active;
        if (activeTab === 'expired') return !offer.is_active; // treating inactive as expired for simplicity in this view context
        return true;
    });

    return (
        <>
            <div className="admin-container">
                <header className="admin-header">
                    <div className="header-content">
                        <h1>Offers & Coupons</h1>
                        <p>Manage your store discounts and promo codes</p>
                    </div>
                    <div className="header-actions">
                        <button className="create-offer-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                            <span className="plus-icon">{showCreateForm ? '-' : '+'}</span> {showCreateForm ? 'Cancel' : 'Create New Offer'}
                        </button>
                    </div>
                </header>

                {showCreateForm && (
                    <div className="create-offer-form-container" style={{ marginBottom: '20px', padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
                        <h3>Create New Offer</h3>
                        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <input
                                type="text" placeholder="Coupon Code (e.g. SAVE20)"
                                value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <input
                                type="text" placeholder="Offer Title"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <select
                                value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                            <input
                                type="number" placeholder="Discount Value"
                                value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                                required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <input
                                type="number" placeholder="Min Order Amount"
                                value={formData.min_order_amount} onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <input
                                type="date" placeholder="Valid Until"
                                value={formData.valid_until} onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <button type="submit" className="create-offer-btn" style={{ gridColumn: 'span 2', marginTop: '10px' }}>Save Offer</button>
                        </form>
                    </div>
                )}

                <div className="offers-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'is_active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('is_active')}
                    >
                        Active Offers
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expired')}
                    >
                        Inactive
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All History
                    </button>
                </div>

                <div className="offers-grid">
                    {loading ? (
                        <div>Loading offers...</div>
                    ) : filteredOffers.length > 0 ? (
                        filteredOffers.map(offer => (
                            <div key={offer.id} className={`offer-card ${offer.is_active ? 'active' : 'expired'}`}>
                                <div className="offer-header" style={{ borderLeftColor: offer.is_active ? '#28C76F' : '#EA5455' }}>
                                    <span className="offer-code">{offer.code}</span>
                                    <span className={`status-pill ${offer.is_active ? 'active' : 'expired'}`}>{offer.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                                </div>
                                <div className="offer-body">
                                    <h3>{offer.name}</h3>
                                    <div className="offer-details">
                                        <div className="detail-item">
                                            <span className="label">Discount</span>
                                            <span className="value">
                                                {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} OFF
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Min Order</span>
                                            <span className="value">₹{offer.min_order_amount || 0}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Valid Until</span>
                                            <span className="value">{offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'No Limit'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="offer-footer">
                                    <span className="usage-stats">Used <strong>{offer.times_used || 0}</strong> times</span>
                                    <div>
                                        <button className="action-btn" onClick={() => handleToggle(offer.id, offer.is_active)}>
                                            {offer.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button className="action-btn delete-btn" style={{ marginLeft: '5px', color: '#dc2626' }} onClick={() => handleDelete(offer.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-offers">
                            <p>No offers found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Offers;
