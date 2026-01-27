
import React, { useState } from 'react';
import Navbar from './Navbar';
import './Offers.css';

const Offers = () => {
    const [activeTab, setActiveTab] = useState('active');

    // Mock Data for Offers
    const offers = [
        {
            id: 1,
            code: 'FREESHIP',
            title: 'Free Shipping on orders over ₹500',
            discount: 'Free Shipping',
            minOrder: 500,
            validUntil: '2026-02-28',
            usageCount: 45,
            status: 'active',
            color: '#FF9F43'
        },
        {
            id: 2,
            code: 'WELCOME50',
            title: 'Flat ₹50 off for new customers',
            discount: '₹50 OFF',
            minOrder: 200,
            validUntil: '2026-03-15',
            usageCount: 120,
            status: 'active',
            color: '#28C76F'
        },
        {
            id: 3,
            code: 'DIWALI20',
            title: '20% off Diwali Special',
            discount: '20% OFF',
            minOrder: 1000,
            validUntil: '2025-11-01',
            usageCount: 300,
            status: 'expired',
            color: '#EA5455'
        }
    ];

    const filteredOffers = offers.filter(offer =>
        activeTab === 'all' ? true : offer.status === activeTab
    );

    return (
        <>
            <Navbar />
            <div className="admin-container">
                <header className="admin-header">
                    <div className="header-content">
                        <h1>Offers & Coupons</h1>
                        <p>Manage your store discounts and promo codes</p>
                    </div>
                    <div className="header-actions">
                        <button className="create-offer-btn">
                            <span className="plus-icon">+</span> Create New Offer
                        </button>
                    </div>
                </header>

                <div className="offers-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Offers
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expired')}
                    >
                        Expired
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All History
                    </button>
                </div>

                <div className="offers-grid">
                    {filteredOffers.length > 0 ? (
                        filteredOffers.map(offer => (
                            <div key={offer.id} className={`offer-card ${offer.status}`}>
                                <div className="offer-header" style={{ borderLeftColor: offer.color }}>
                                    <span className="offer-code">{offer.code}</span>
                                    <span className={`status-pill ${offer.status}`}>{offer.status}</span>
                                </div>
                                <div className="offer-body">
                                    <h3>{offer.title}</h3>
                                    <div className="offer-details">
                                        <div className="detail-item">
                                            <span className="label">Discount</span>
                                            <span className="value">{offer.discount}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Min Order</span>
                                            <span className="value">₹{offer.minOrder}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Valid Until</span>
                                            <span className="value">{new Date(offer.validUntil).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="offer-footer">
                                    <span className="usage-stats">Used <strong>{offer.usageCount}</strong> times</span>
                                    <button className="action-btn">Edit</button>
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
