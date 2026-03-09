
import React, { useState, useEffect } from 'react';
import './Reports.css';
import { analyticsService } from '../../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
    const [dateRange, setDateRange] = useState('7days');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const data = await analyticsService.getReports(dateRange);
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to load reports", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [dateRange]);

    return (
        <>
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
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 3 Months</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </header>

                <div className="reports-grid">
                    {/* Key Metrics */}
                    <div className="metric-card revenue">
                        <div className="metric-icon">💰</div>
                        <div className="metric-content">
                            <h3>Total Revenue</h3>
                            <p className="metric-value">₹{(analytics?.total_revenue || 0).toLocaleString()}</p>
                            <p className="metric-change positive">--</p>
                        </div>
                    </div>

                    <div className="metric-card orders">
                        <div className="metric-icon">🥡</div>
                        <div className="metric-content">
                            <h3>Total Orders</h3>
                            <p className="metric-value">{analytics?.total_orders || 0}</p>
                            <p className="metric-change positive">--</p>
                        </div>
                    </div>

                    <div className="metric-card aov">
                        <div className="metric-icon">📊</div>
                        <div className="metric-content">
                            <h3>Avg. Order Value</h3>
                            <p className="metric-value">₹{(analytics?.avg_order_value || 0).toFixed(0)}</p>
                            <p className="metric-change neutral">--</p>
                        </div>
                    </div>

                    <div className="metric-card cancelled">
                        <div className="metric-icon">✅</div>
                        <div className="metric-content">
                            <h3>Completed</h3>
                            <p className="metric-value">{analytics?.completed_orders || 0}</p>
                            <p className="metric-change positive">--</p>
                        </div>
                    </div>

                    {/* Sales Chart (Recharts) */}
                    <div className="chart-section" style={{ height: '400px', width: '100%', marginBottom: '20px' }}>
                        <h2>Sales Trend (Revenue)</h2>
                        <div className="chart-container" style={{ width: '100%', height: '300px' }}>
                            {(!analytics || !analytics.daily_revenue_data || analytics.daily_revenue_data.length === 0) ? (
                                <div style={{ width: '100%', textAlign: 'center', padding: '20px' }}>No data for this period</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.daily_revenue_data}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                                        />
                                        <YAxis tickFormatter={(val) => `₹${val}`} width={80} />
                                        <Tooltip
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            cursor={{fill: 'transparent'}}
                                        />
                                        <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Top Products Table */}
                    <div className="table-section">
                        <h2>🏆 Top Selling Products</h2>
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
                                    {(!analytics || !analytics.top_items || analytics.top_items.length === 0) ? (
                                        <tr>
                                            <td colSpan="5" className="text-center">No top items data available.</td>
                                        </tr>
                                    ) : (
                                        analytics.top_items.map((item, index) => (
                                            <tr key={index}>
                                                <td>#{index + 1}</td>
                                                <td>{item.item_name}</td>
                                                <td>{item.total_quantity}</td>
                                                <td>₹{(item.total_revenue || 0).toLocaleString()}</td>
                                                <td className="positive">--</td>
                                            </tr>
                                        ))
                                    )}
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
