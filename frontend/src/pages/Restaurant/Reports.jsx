import React, { useState, useEffect } from 'react';
import './Reports.css';
import { analyticsService } from '../../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [dateRange, setDateRange] = useState('7days');

	useEffect(() => {
		fetchAnalytics();
	}, [dateRange]);

	const fetchAnalytics = async () => {
		try {
			setLoading(true);
			const data = await analyticsService.getReports(dateRange);
			setAnalytics(data);
		} catch (error) {
			console.error('Failed to fetch analytics:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="reports-page-wrapper">
				<div className="reports-container">
					<div className="loading">Loading reports...</div>
				</div>
			</div>
		);
	}

	if (!analytics) {
		return (
			<div className="reports-page-wrapper">
				<div className="reports-container">
					<div className="no-data">No analytics data available</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="reports-page-wrapper">
				<div className="reports-container">
					<div className="reports-header">
						<div>
							<h1>Reports & Analytics</h1>
							<p>Track your restaurant performance</p>
						</div>
						<select
							value={dateRange}
							onChange={(e) => setDateRange(e.target.value)}
							className="date-range-select"
						>
							<option value="7days">Last 7 Days</option>
							<option value="30days">Last 30 Days</option>
							<option value="90days">Last 3 Months</option>
							<option value="all">All Time</option>
						</select>
					</div>

					{/* Stats Overview */}
					<div className="metrics-grid">
						<div className="metric-card">
							<div className="metric-icon revenue">💰</div>
							<div className="metric-info">
								<h3>Total Revenue</h3>
								<p className="metric-value">₹{(analytics.total_revenue || 0).toLocaleString()}</p>
							</div>
						</div>
						<div className="metric-card">
							<div className="metric-icon orders">📦</div>
							<div className="metric-info">
								<h3>Total Orders</h3>
								<p className="metric-value">{analytics.total_orders || 0}</p>
							</div>
						</div>
						<div className="metric-card">
							<div className="metric-icon aov">📈</div>
							<div className="metric-info">
								<h3>Average Order Value</h3>
								<p className="metric-value">₹{(analytics.avg_order_value || 0).toFixed(0)}</p>
							</div>
						</div>
						<div className="metric-card">
							<div className="metric-icon completed">✅</div>
							<div className="metric-info">
								<h3>Completed Orders</h3>
								<p className="metric-value">{analytics.completed_orders || 0}</p>
							</div>
						</div>
					</div>

					{/* Daily Revenue Chart */}
					<div className="chart-section">
						<h2>Daily Revenue Trend</h2>
						<div className="chart-responsive-wrapper">
							{analytics.daily_revenue_data && analytics.daily_revenue_data.length > 0 ? (
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
							) : (
								<div className="no-chart-data">No daily data available</div>
							)}
						</div>
					</div>

					{/* Top Performing Items & Order Status (side by side on desktop) */}
					<div className="reports-bottom-grid">
						{/* Top Performing Items */}
						<div className="report-section-card">
							<h2>Top Performing Items</h2>
							<div className="table-responsive">
								<table className="modern-table">
									<thead>
										<tr>
											<th>Rank</th>
											<th>Item Name</th>
											<th>Orders</th>
											<th>Revenue</th>
										</tr>
									</thead>
									<tbody>
										{analytics.top_items && analytics.top_items.length > 0 ? (
											analytics.top_items.map((item, index) => (
												<tr key={index}>
													<td className="rank-cell">#{index + 1}</td>
													<td className="name-cell">{item.item_name}</td>
													<td className="orders-cell">{item.total_quantity}</td>
													<td className="revenue-cell">₹{(item.total_revenue || 0).toLocaleString()}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan="4" className="no-data-cell">No top items data available</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>

						{/* Order Status Breakdown */}
						<div className="report-section-card">
							<h2>Order Status Breakdown</h2>
							<div className="status-progress-container">
								{analytics.total_orders > 0 ? (
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
}
