import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            <div className="dash-header">
                <h1>Overview</h1>
                <p>Welcome back, Seller!</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card orange">
                    <span className="stat-title">Total Orders</span>
                    <span className="stat-value">124</span>
                </div>
                <div className="stat-card yellow">
                    <span className="stat-title">Todays Revenue</span>
                    <span className="stat-value">₹ 4,500</span>
                </div>
                <div className="stat-card orange">
                    <span className="stat-title">Pending Orders</span>
                    <span className="stat-value">12</span>
                </div>
                <div className="stat-card yellow">
                    <span className="stat-title">Total Items</span>
                    <span className="stat-value">45</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
