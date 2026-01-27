
import React, { useState } from 'react';
import Navbar from './Navbar';
import './Reports.css';

const Reports = () => {
    const [dateRange, setDateRange] = useState('7days');

    // Mock Data for Reports
    const summaryStats = {
        totalRevenue: 25400,
        totalOrders: 85,
        avgOrderValue: 298,
        cancelledOrders: 2
    };

    const topProducts = [
        { id: 1, name: 'Fresh Organic Tomatoes', sales: 120, revenue: 4800, growth: '+12%' },
        { id: 2, name: 'Aashirvaad Whole Wheat Atta', sales: 85, revenue: 34000, growth: '+5%' },
        { id: 3, name: 'Amul Butter 500g', sales: 60, revenue: 16200, growth: '-2%' },
        { id: 4, name: 'Tata Salt 1kg', sales: 55, revenue: 1650, growth: '+8%' },
        { id: 5, name: 'Fortune Sun Lite Oil', sales: 40, revenue: 6400, growth: '+15%' },
    ];

    const salesTrend = [
        { day: 'Mon', value: 40 },
        { day: 'Tue', value: 65 },
        { day: 'Wed', value: 35 },
        { day: 'Thu', value: 50 },
        { day: 'Fri', value: 80 },
        { day: 'Sat', value: 95 },
        { day: 'Sun', value: 70 },
    ];

    const maxTrendValue = 100; // For scaling bars

    return (
        <>
            <Navbar />
            <div className="admin-container">
                <header className="admin-header">
                    <div className="header-content">
                        <h1>Reports & Analytics</h1>
                        <p>Insights into your store's performance</p>
                    </div>
                    <div className="header-actions">
                        <select
                            className="date-range-select"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="thisMonth">This Month</option>
                        </select>
                        <button className="export-btn">Download PDF</button>
                    </div>
                </header>

                <div className="reports-grid">
                    {/* Key Metrics */}
                    <div className="metric-card revenue">
                        <div className="metric-icon">💰</div>
                        <div className="metric-content">
                            <h3>Total Revenue</h3>
                            <p className="metric-value">₹{summaryStats.totalRevenue.toLocaleString()}</p>
                            <p className="metric-change positive">↑ 14% vs last period</p>
                        </div>
                    </div>

                    <div className="metric-card orders">
                        <div className="metric-icon">🥡</div>
                        <div className="metric-content">
                            <h3>Total Orders</h3>
                            <p className="metric-value">{summaryStats.totalOrders}</p>
                            <p className="metric-change positive">↑ 8% vs last period</p>
                        </div>
                    </div>

                    <div className="metric-card aov">
                        <div className="metric-icon">📊</div>
                        <div className="metric-content">
                            <h3>Avg. Order Value</h3>
                            <p className="metric-value">₹{summaryStats.avgOrderValue}</p>
                            <p className="metric-change neutral">− 0% stable</p>
                        </div>
                    </div>

                    <div className="metric-card cancelled">
                        <div className="metric-icon">❌</div>
                        <div className="metric-content">
                            <h3>Cancelled</h3>
                            <p className="metric-value">{summaryStats.cancelledOrders}</p>
                            <p className="metric-change negative">↓ 1 less than last period</p>
                        </div>
                    </div>

                    {/* Sales Chart (CSS Bar Chart) */}
                    <div className="chart-section">
                        <h2>Sales Trend (Last 7 Days)</h2>
                        <div className="bar-chart">
                            {salesTrend.map((item, index) => (
                                <div key={index} className="chart-column">
                                    <div
                                        className="bar"
                                        style={{ height: `${(item.value / maxTrendValue) * 100}%` }}
                                        data-value={item.value}
                                    ></div>
                                    <span className="chk-label">{item.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products Table */}
                    <div className="table-section">
                        <h2>Top Selling Products</h2>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Product Name</th>
                                        <th>Units Sold</th>
                                        <th>Revenue</th>
                                        <th>Growth</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product, index) => (
                                        <tr key={product.id}>
                                            <td>#{index + 1}</td>
                                            <td>{product.name}</td>
                                            <td>{product.sales}</td>
                                            <td>₹{product.revenue.toLocaleString()}</td>
                                            <td className={product.growth.startsWith('+') ? 'text-success' : 'text-danger'}>
                                                {product.growth}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Reports;
