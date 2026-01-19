import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import '../../styles/dashboard/dashboard.css';

const Dashboard = () => {
    return (
        <>
            <Navbar />
            <div className="dashboard-layout">
                <Sidebar />

                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <h1 className="welcome-text">Dashboard Overview</h1>
                        <p className="date-text">Welcome back, here's what's happening today.</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-title">Total Orders</span>
                            <span className="stat-value">128</span>
                            <span className="trend-positive">↑ 12% from yesterday</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-title">Total Revenue</span>
                            <span className="stat-value">₹12,450</span>
                            <span className="trend-positive">↑ 8% from yesterday</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-title">Active Menu Items</span>
                            <span className="stat-value">45</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-title">Customer Rating</span>
                            <span className="stat-value">4.8</span>
                        </div>
                    </div>

                    <h2 className="dashboard-section-title">Recent Orders</h2>
                    <div className="recent-orders">
                        <p>No active orders right now. Waiting for new customers!</p>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Dashboard;
