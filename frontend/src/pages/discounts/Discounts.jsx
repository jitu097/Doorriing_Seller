import React, { useState } from 'react';
import './Discounts.css';

const Discounts = () => {
    const [activeTab, setActiveTab] = useState('active');

    const demoDiscounts = [
        {
            id: 1,
            code: 'WELCOME50',
            description: 'Welcome offer for new customers',
            discount: '50%',
            type: 'percentage',
            minOrder: 500,
            maxDiscount: 200,
            status: 'active',
            validUntil: '2026-02-28',
            usedCount: 45
        },
        {
            id: 2,
            code: 'FLAT100',
            description: 'Flat ₹100 off on all orders',
            discount: '₹100',
            type: 'flat',
            minOrder: 300,
            maxDiscount: 100,
            status: 'active',
            validUntil: '2026-01-31',
            usedCount: 120
        },
        {
            id: 3,
            code: 'WEEKEND30',
            description: 'Weekend special discount',
            discount: '30%',
            type: 'percentage',
            minOrder: 400,
            maxDiscount: 150,
            status: 'expired',
            validUntil: '2026-01-15',
            usedCount: 78
        },
        {
            id: 4,
            code: 'FIRSTORDER',
            description: 'First order discount',
            discount: '40%',
            type: 'percentage',
            minOrder: 200,
            maxDiscount: 100,
            status: 'active',
            validUntil: '2026-03-31',
            usedCount: 25
        },
    ];

    const filteredDiscounts = activeTab === 'all'
        ? demoDiscounts
        : demoDiscounts.filter(d => d.status === activeTab);

    return (
        <div className="discounts-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Discount Codes</h1>
                    <p className="page-subtitle">Create and manage promotional discount codes</p>
                </div>
                <button className="btn-primary">+ Create Discount</button>
            </div>

            <div className="discounts-stats">
                <div className="stat-box">
                    <span className="stat-icon">🏷️</span>
                    <div>
                        <p className="stat-label">Total Discounts</p>
                        <p className="stat-value">{demoDiscounts.length}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <span className="stat-icon">✅</span>
                    <div>
                        <p className="stat-label">Active</p>
                        <p className="stat-value">{demoDiscounts.filter(d => d.status === 'active').length}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <span className="stat-icon">📊</span>
                    <div>
                        <p className="stat-label">Total Usage</p>
                        <p className="stat-value">{demoDiscounts.reduce((sum, d) => sum + d.usedCount, 0)}</p>
                    </div>
                </div>
            </div>

            <div className="discounts-tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Discounts
                </button>
                <button
                    className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active
                </button>
                <button
                    className={`tab ${activeTab === 'expired' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expired')}
                >
                    Expired
                </button>
            </div>

            <div className="discounts-grid">
                {filteredDiscounts.map(discount => (
                    <div key={discount.id} className="discount-card">
                        <div className="discount-header">
                            <div className="discount-code">
                                <span className="code-icon">🎫</span>
                                <span className="code-text">{discount.code}</span>
                            </div>
                            <span className={`status-badge ${discount.status === 'active' ? 'status-active' : 'status-expired'}`}>
                                {discount.status === 'active' ? '● Active' : '● Expired'}
                            </span>
                        </div>

                        <p className="discount-description">{discount.description}</p>

                        <div className="discount-details">
                            <div className="detail-item">
                                <span className="detail-label">Discount</span>
                                <span className="detail-value highlight">{discount.discount} OFF</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Min. Order</span>
                                <span className="detail-value">₹{discount.minOrder}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Max. Discount</span>
                                <span className="detail-value">₹{discount.maxDiscount}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Valid Until</span>
                                <span className="detail-value">{new Date(discount.validUntil).toLocaleDateString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="discount-usage">
                            <span className="usage-text">Used {discount.usedCount} times</span>
                            <div className="discount-actions">
                                <button className="btn-edit">Edit</button>
                                <button className="btn-delete">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Discounts;
