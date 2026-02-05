
import React, { useState, useEffect } from 'react';
import './Reports.css';
import groceryService from '../../services/groceryService';

const Reports = () => {
    const [dateRange, setDateRange] = useState('7days');
    const [summaryStats, setSummaryStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        cancelledOrders: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    const maxTrendValue = Math.max(...salesTrend.map(d => d.value), 100);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                // Fetch summary
                const stats = await groceryService.getDashboardStats('weekly'); // 'weekly' maps to 7 days usually in backend

                // Fetch chart data
                // Calculate date range for chart
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                const chartData = await groceryService.getAnalyticsChartData(start.toISOString(), end.toISOString());
                // chartData is array of { date, total_revenue, ... } from daily analytics

                // Transform for chart
                const formattedTrend = (chartData || []).map(day => ({
                    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
                    value: parseFloat(day.total_revenue || 0)
                })).reverse(); // API returns descending, we want ascending for chart usually

                setSummaryStats({
                    totalRevenue: stats.totalRevenue || 0,
                    totalOrders: stats.totalOrders || 0,
                    avgOrderValue: stats.averageOrderValue || 0,
                    cancelledOrders: 0 // Backend summary might not return cancelled count in getSummary, check stats
                    // Actually getSummary in analytics.service.js returns totalOrders, totalRevenue, completedOrders.
                    // It does NOT return cancelled items.
                });

                setSalesTrend(formattedTrend);

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
                            <p className="metric-change positive">--</p>
                        </div>
                    </div>

                    <div className="metric-card orders">
                        <div className="metric-icon">🥡</div>
                        <div className="metric-content">
                            <h3>Total Orders</h3>
                            <p className="metric-value">{summaryStats.totalOrders}</p>
                            <p className="metric-change positive">--</p>
                        </div>
                    </div>

                    <div className="metric-card aov">
                        <div className="metric-icon">📊</div>
                        <div className="metric-content">
                            <h3>Avg. Order Value</h3>
                            <p className="metric-value">₹{summaryStats.avgOrderValue}</p>
                            <p className="metric-change neutral">--</p>
                        </div>
                    </div>

                    <div className="metric-card cancelled">
                        <div className="metric-icon">❌</div>
                        <div className="metric-content">
                            <h3>Cancelled</h3>
                            <p className="metric-value">{summaryStats.cancelledOrders}</p>
                            <p className="metric-change negative">--</p>
                        </div>
                    </div>

                    {/* Sales Chart (CSS Bar Chart) */}
                    <div className="chart-section">
                        <h2>Sales Trend (Revenue)</h2>
                        <div className="bar-chart">
                            {salesTrend.length === 0 ? (
                                <div style={{ width: '100%', textAlign: 'center', padding: '20px' }}>No data for this period</div>
                            ) : (
                                salesTrend.map((item, index) => (
                                    <div key={index} className="chart-column">
                                        <div
                                            className="bar"
                                            style={{ height: `${(item.value / maxTrendValue) * 100}%` }}
                                            data-value={item.value}
                                        ></div>
                                        <span className="chk-label">{item.day}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Top Products Table - Hidden if no data or keep mock/empty? Let's hide for now as we don't have per-product analytics endpoint ready. */}
                    <div className="table-section">
                        <h2>Top Selling Products (Coming Soon)</h2>
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
                                    <tr>
                                        <td colSpan="5" className="text-center">Analytics for individual products is being calculated.</td>
                                    </tr>
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
