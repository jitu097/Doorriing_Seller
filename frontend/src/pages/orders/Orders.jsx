import React, { useState } from 'react';
import './Orders.css';

const Orders = () => {
    const [activeTab, setActiveTab] = useState('all');

    const demoOrders = [
        { id: 'ORD-001', customer: 'Rahul Sharma', items: 3, total: 1250, status: 'delivered', date: '2026-01-18' },
        { id: 'ORD-002', customer: 'Priya Singh', items: 2, total: 890, status: 'pending', date: '2026-01-19' },
        { id: 'ORD-003', customer: 'Amit Kumar', items: 1, total: 450, status: 'processing', date: '2026-01-19' },
        { id: 'ORD-004', customer: 'Sneha Patel', items: 5, total: 2100, status: 'delivered', date: '2026-01-17' },
        { id: 'ORD-005', customer: 'Vikram Reddy', items: 2, total: 670, status: 'cancelled', date: '2026-01-16' },
    ];

    const getStatusBadge = (status) => {
        const badges = {
            delivered: { class: 'status-delivered', text: 'Delivered' },
            pending: { class: 'status-pending', text: 'Pending' },
            processing: { class: 'status-processing', text: 'Processing' },
            cancelled: { class: 'status-cancelled', text: 'Cancelled' }
        };
        return badges[status];
    };

    const filteredOrders = activeTab === 'all' 
        ? demoOrders 
        : demoOrders.filter(order => order.status === activeTab);

    return (
        <div className="orders-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Orders Management</h1>
                    <p className="page-subtitle">Track and manage all your customer orders</p>
                </div>
                <button className="btn-primary">Export Orders</button>
            </div>

            <div className="orders-stats">
                <div className="stat-box">
                    <span className="stat-icon">📦</span>
                    <div>
                        <p className="stat-label">Total Orders</p>
                        <p className="stat-value">{demoOrders.length}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <span className="stat-icon">⏳</span>
                    <div>
                        <p className="stat-label">Pending</p>
                        <p className="stat-value">{demoOrders.filter(o => o.status === 'pending').length}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <span className="stat-icon">✅</span>
                    <div>
                        <p className="stat-label">Delivered</p>
                        <p className="stat-value">{demoOrders.filter(o => o.status === 'delivered').length}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <span className="stat-icon">💰</span>
                    <div>
                        <p className="stat-label">Total Revenue</p>
                        <p className="stat-value">₹{demoOrders.reduce((sum, o) => sum + o.total, 0)}</p>
                    </div>
                </div>
            </div>

            <div className="orders-tabs">
                <button 
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Orders
                </button>
                <button 
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending
                </button>
                <button 
                    className={`tab ${activeTab === 'processing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('processing')}
                >
                    Processing
                </button>
                <button 
                    className={`tab ${activeTab === 'delivered' ? 'active' : ''}`}
                    onClick={() => setActiveTab('delivered')}
                >
                    Delivered
                </button>
            </div>

            <div className="orders-table">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id}>
                                <td className="order-id">{order.id}</td>
                                <td className="customer-name">{order.customer}</td>
                                <td>{order.items} items</td>
                                <td className="order-total">₹{order.total}</td>
                                <td>
                                    <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                                        {getStatusBadge(order.status).text}
                                    </span>
                                </td>
                                <td>{new Date(order.date).toLocaleDateString('en-IN')}</td>
                                <td>
                                    <button className="btn-action">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Orders;
