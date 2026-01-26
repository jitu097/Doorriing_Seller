import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Reports.css';
import { analyticsService } from '../../services/analyticsService';

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
			const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
			const data = await analyticsService.getSummary(days);
			setAnalytics(data);
		} catch (error) {
			console.error('Failed to fetch analytics:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<>
				<Navbar />
				<div className="reports-container">
					<div className="loading">Loading reports...</div>
				</div>
			</>
		);
	}

	if (!analytics) {
		return (
			<>
				<Navbar />
				<div className="reports-container">
					<div className="no-data">No analytics data available</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<div className="reports-container">
				<div className="reports-header">
					<div>
						<h1>📊 Sales Reports & Analytics</h1>
						<p>Track your restaurant performance</p>
					</div>
					<select 
						value={dateRange} 
						onChange={(e) => setDateRange(e.target.value)}
						className="date-range-select"
					>
						<option value="7days">Last 7 Days</option>
						<option value="30days">Last 30 Days</option>
						<option value="90days">Last 90 Days</option>
						<option value="custom">Custom Range</option>
					</select>
				</div>

				{/* Stats Overview */}
				<div className="stats-grid">
					<div className="stat-card">
						<div className="stat-icon revenue">💰</div>
						<div className="stat-info">
							<h3>Total Revenue</h3>
							<p className="stat-value">₹{(analytics.total_revenue || 0).toLocaleString()}</p>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon orders">📦</div>
						<div className="stat-info">
							<h3>Total Orders</h3>
							<p className="stat-value">{analytics.total_orders || 0}</p>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon avg">📈</div>
						<div className="stat-info">
							<h3>Avg Order Value</h3>
							<p className="stat-value">₹{(analytics.avg_order_value || 0).toFixed(0)}</p>
						</div>
					</div>
					<div className="stat-card">
						<div className="stat-icon completed">✅</div>
						<div className="stat-info">
							<h3>Completed</h3>
							<p className="stat-value">{analytics.completed_orders || 0}</p>
						</div>
					</div>
				</div>

				{/* Daily Revenue Chart */}
				<div className="report-section">
					<h2>📈 Daily Revenue Trend</h2>
					<div className="chart-container">
						{analytics.daily_data && analytics.daily_data.length > 0 ? (
							analytics.daily_data.map((day, index) => {
								const maxRevenue = Math.max(...analytics.daily_data.map(d => d.revenue || 0));
								return (
									<div key={index} className="chart-bar">
										<div 
											className="bar" 
											style={{ height: `${maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0}%` }}
											title={`₹${(day.revenue || 0).toLocaleString()}`}
										></div>
										<span className="bar-label">
											{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
										</span>
									</div>
								);
							})
						) : (
							<div className="no-chart-data">No daily data available</div>
						)}
					</div>
				</div>

				{/* Top Performing Items */}
				<div className="report-section">
					<h2>🏆 Top Performing Items</h2>
					<div className="table-container">
						<div className="table-header">
							<span>Rank</span>
							<span>Item Name</span>
							<span>Orders</span>
							<span>Revenue</span>
						</div>
						{analytics.top_items && analytics.top_items.length > 0 ? (
							analytics.top_items.map((item, index) => (
								<div key={index} className="table-row">
									<span className="rank">#{index + 1}</span>
									<span className="item-name">{item.item_name}</span>
									<span className="orders">{item.total_quantity}</span>
									<span className="revenue">₹{(item.total_revenue || 0).toLocaleString()}</span>
								</div>
							))
						) : (
							<div className="no-data">No top items data available</div>
						)}
					</div>
				</div>

				{/* Order Status Breakdown */}
				<div className="report-section">
					<h2>📊 Order Status Breakdown</h2>
					<div className="status-container">
						{analytics.total_orders > 0 && (
							<>
								<div className="status-item">
									<div 
										className="status-bar completed" 
										style={{ width: `${((analytics.completed_orders || 0) / analytics.total_orders * 100).toFixed(1)}%` }}
									>
										<span>Completed: {analytics.completed_orders || 0}</span>
									</div>
								</div>
								<div className="status-item">
									<div 
										className="status-bar pending" 
										style={{ width: `${((analytics.pending_orders || 0) / analytics.total_orders * 100).toFixed(1)}%` }}
									>
										<span>Pending: {analytics.pending_orders || 0}</span>
									</div>
								</div>
								<div className="status-item">
									<div 
										className="status-bar cancelled" 
										style={{ width: `${((analytics.cancelled_orders || 0) / analytics.total_orders * 100).toFixed(1)}%` }}
									>
										<span>Cancelled: {analytics.cancelled_orders || 0}</span>
									</div>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Export Options */}
				<div className="export-section">
					<button className="btn-export">📄 Export PDF</button>
					<button className="btn-export">📊 Export Excel</button>
					<button className="btn-export">📧 Email Report</button>
				</div>
			</div>
		</>
	);
}
