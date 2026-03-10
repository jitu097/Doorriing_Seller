
import React, { useState, useEffect } from 'react';
import './Reports.css';
import { analyticsService } from '../../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loader from '../../components/common/Loader';

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

    if (loading) return <Loader message="Loading reports..." />;

    return (
        <>
            <div className="reports-page-wrapper">
                <div className="reports-container">
                    <div className="reports-header">
                        <div>
                            <h1>Reports & Analytics</h1>
                            <p>Insights into your store's performance</p>
                        </div>
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

                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-icon revenue">💰</div>
                            <div className="metric-info">
                                <h3>Total Revenue</h3>
                                <p className="metric-value">₹{(analytics?.total_revenue || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon orders">📦</div>
                            <div className="metric-info">
                                <h3>Total Orders</h3>
                                <p className="metric-value">{analytics?.total_orders || 0}</p>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon aov">📈</div>
                            <div className="metric-info">
                                <h3>Avg. Order Value</h3>
                                <p className="metric-value">₹{(analytics?.avg_order_value || 0).toFixed(0)}</p>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-icon completed">✅</div>
                            <div className="metric-info">
                                <h3>Completed Orders</h3>
                                <p className="metric-value">{analytics?.completed_orders || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sales Chart (Recharts) */}
                    <div className="chart-section">
                        <h2>Sales Trend (Revenue)</h2>
                        <div className="chart-responsive-wrapper">
                            {(!analytics || !analytics.daily_revenue_data || analytics.daily_revenue_data.length === 0) ? (
                                <div className="no-chart-data">No data for this period</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.daily_revenue_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `₹${val}`}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            cursor={{ fill: 'rgba(109, 29, 29, 0.05)' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="revenue" fill="rgb(109, 29, 29)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="reports-bottom-grid">
                        {/* Top Products Table */}
                        <div className="report-section-card">
                            <h2>Top Selling Products</h2>
                            <div className="table-responsive">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Product Name</th>
                                            <th>Units Sold</th>
                                            <th>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!analytics || !analytics.top_items || analytics.top_items.length === 0) ? (
                                            <tr>
                                                <td colSpan="4" className="no-data-cell">No top items data available.</td>
                                            </tr>
                                        ) : (
                                            analytics.top_items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="rank-cell">#{index + 1}</td>
                                                    <td className="name-cell">{item.item_name}</td>
                                                    <td className="orders-cell">{item.total_quantity}</td>
                                                    <td className="revenue-cell">₹{(item.total_revenue || 0).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Order Status Breakdown Extension Placeholder (so the layout matches 2fr 1fr grid) */}
                        <div className="report-section-card">
                            <h2>Order Status Breakdown</h2>
                            <div className="status-progress-container">
                                {analytics?.total_orders > 0 ? (
                                    <>
                                        <div className="status-progress-item">
                                            <div className="status-label-row">
                                                <span className="status-name text-completed">Completed</span>
                                                <span className="status-count">{analytics.completed_orders || 0}</span>
                                            </div>
                                            <div className="status-bar-bg">
                                                <div className="status-bar-fill completed-fill" style={{ width: `${((analytics.completed_orders || 0) / analytics.total_orders * 100).toFixed(1)}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="status-progress-item">
                                            <div className="status-label-row">
                                                <span className="status-name text-pending">Pending</span>
                                                <span className="status-count">{analytics.pending_orders || 0}</span>
                                            </div>
                                            <div className="status-bar-bg">
                                                <div className="status-bar-fill pending-fill" style={{ width: `${((analytics.pending_orders || 0) / analytics.total_orders * 100).toFixed(1)}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="status-progress-item">
                                            <div className="status-label-row">
                                                <span className="status-name text-cancelled">Cancelled</span>
                                                <span className="status-count">{analytics.cancelled_orders || 0}</span>
                                            </div>
                                            <div className="status-bar-bg">
                                                <div className="status-bar-fill cancelled-fill" style={{ width: `${((analytics.cancelled_orders || 0) / analytics.total_orders * 100).toFixed(1)}%` }}></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-data-cell">No order data available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Reports;
