import React from 'react';
import './Analytics.css';

const Analytics = () => {
    const salesData = [
        { day: 'Mon', sales: 2500 },
        { day: 'Tue', sales: 3200 },
        { day: 'Wed', sales: 2800 },
        { day: 'Thu', sales: 4100 },
        { day: 'Fri', sales: 3800 },
        { day: 'Sat', sales: 5200 },
        { day: 'Sun', sales: 4600 },
    ];

    const topItems = [
        { name: 'Butter Chicken', orders: 156, revenue: 54600 },
        { name: 'Veg Biryani', orders: 142, revenue: 39760 },
        { name: 'Paneer Tikka', orders: 128, revenue: 32000 },
        { name: 'Masala Dosa', orders: 98, revenue: 14700 },
    ];

    const maxSales = Math.max(...salesData.map(d => d.sales));

    return (
        <div className="analytics-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics & Reports</h1>
                    <p className="page-subtitle">Track your business performance and insights</p>
                </div>
                <button className="btn-primary">Download Report</button>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-content">
                        <p className="metric-label">Total Revenue</p>
                        <h2 className="metric-value">₹25,840</h2>
                        <span className="metric-change positive">+12.5% from last week</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">📦</div>
                    <div className="metric-content">
                        <p className="metric-label">Total Orders</p>
                        <h2 className="metric-value">524</h2>
                        <span className="metric-change positive">+8.3% from last week</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">👥</div>
                    <div className="metric-content">
                        <p className="metric-label">New Customers</p>
                        <h2 className="metric-value">89</h2>
                        <span className="metric-change positive">+15.2% from last week</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">⭐</div>
                    <div className="metric-content">
                        <p className="metric-label">Avg. Rating</p>
                        <h2 className="metric-value">4.8</h2>
                        <span className="metric-change neutral">Same as last week</span>
                    </div>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Weekly Sales</h3>
                        <span className="chart-subtitle">Last 7 days performance</span>
                    </div>
                    <div className="bar-chart">
                        {salesData.map((data, index) => (
                            <div key={index} className="bar-wrapper">
                                <div className="bar-container">
                                    <div
                                        className="bar"
                                        style={{ height: `${(data.sales / maxSales) * 100}%` }}
                                    >
                                        <span className="bar-value">₹{data.sales}</span>
                                    </div>
                                </div>
                                <span className="bar-label">{data.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Top Selling Items</h3>
                        <span className="chart-subtitle">Best performing products</span>
                    </div>
                    <div className="top-items-list">
                        {topItems.map((item, index) => (
                            <div key={index} className="top-item">
                                <div className="item-rank">{index + 1}</div>
                                <div className="item-info">
                                    <p className="item-name">{item.name}</p>
                                    <p className="item-stats">{item.orders} orders · ₹{item.revenue.toLocaleString()}</p>
                                </div>
                                <div className="item-progress">
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${(item.revenue / topItems[0].revenue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="insights-section">
                <h3 className="insights-title">Business Insights</h3>
                <div className="insights-grid">
                    <div className="insight-card">
                        <span className="insight-icon">📈</span>
                        <div>
                            <h4 className="insight-heading">Peak Hours</h4>
                            <p className="insight-text">Most orders received between 7 PM - 9 PM</p>
                        </div>
                    </div>
                    <div className="insight-card">
                        <span className="insight-icon">🎯</span>
                        <div>
                            <h4 className="insight-heading">Customer Retention</h4>
                            <p className="insight-text">65% of customers are repeat buyers</p>
                        </div>
                    </div>
                    <div className="insight-card">
                        <span className="insight-icon">💡</span>
                        <div>
                            <h4 className="insight-heading">Average Order Value</h4>
                            <p className="insight-text">₹492 per order, +5% from last month</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
