import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import '../Restaurant/Dashboard.css';
import { analyticsService } from '../../services/analyticsService';

function Dashboard() {
	const [stats, setStats] = useState(null);
	const [recentOrders, setRecentOrders] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const data = await analyticsService.getSummary(7);
			setStats(data);
			// You can add an order service call here if you have recent orders endpoint
		} catch (error) {
			console.error('Failed to fetch dashboard data:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<>
				<Navbar />
				<div className="admin-container">
					<div className="loading">Loading dashboard...</div>
				</div>
			</>
		);
	}

	const activeOrdersCount = (stats?.pending_orders || 0);
	const totalRevenue = stats?.total_revenue || 0;
	const deliveredOrders = stats?.completed_orders || 0;
	const cancelledOrders = stats?.cancelled_orders || 0;
	return (
		<>
			<Navbar />
			<div className="admin-container">
			<header className="admin-header">
				<div className="header-content">
					<h1>Dashboard</h1>
					<p>Welcome back! Here's your daily overview.</p>
				</div>
				<div className="header-actions">
					<span className="date-badge">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
				</div>
			</header>

			{/* Stats Grid */}
			<div className="stats-grid">
				<div className="stat-card">
					<div className="stat-icon revenue-icon">💰</div>
					<div className="stat-info">
						<h3>Total Revenue</h3>
						<p className="stat-value">₹{totalRevenue.toLocaleString()}</p>
						<span className="stat-hint">Last 7 days</span>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon orders-icon">🥡</div>
					<div className="stat-info">
						<h3>Active Orders</h3>
						<p className="stat-value">{activeOrdersCount}</p>
						<span className="stat-hint">Pending orders</span>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon success-icon">✅</div>
					<div className="stat-info">
						<h3>Delivered</h3>
						<p className="stat-value">{deliveredOrders}</p>
						<span className="stat-hint">Successfully served</span>
					</div>
				</div>

				<div className="stat-card">
					<div className="stat-icon cancel-icon">❌</div>
					<div className="stat-info">
						<h3>Cancelled</h3>
						<p className="stat-value">{cancelledOrders}</p>
						<span className="stat-hint">Total cancellations</span>
					</div>
				</div>
			</div>

			<div className="dashboard-content-grid">
				{/* Recent Orders Panel */}
				<div className="dashboard-panel recent-orders">
					<div className="panel-header">
						<h2>Recent Orders</h2>
						<Link to="/restaurant/orders" className="view-all-link">View All Orders</Link>
					</div>
					<div className="table-responsive">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Order ID</th>
									<th>Status</th>
									<th>Amount</th>
									<th>Time</th>
								</tr>
							</thead>
							<tbody>
								{recentOrders.length === 0 ? (
									<tr><td colSpan="4" className="empty-state">No recent orders found</td></tr>
								) : (
									recentOrders.slice(0, 5).map(order => (
										<tr key={order._id}>
											<td className="order-id">#{order._id.substring(0, 8)}...</td>
											<td>
												<span className={`status-badge ${order.status.toLowerCase()}`}>
													{order.status}
												</span>
											</td>
											<td className="amount">₹{order.totalAmount}</td>
											<td className="time">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Quick Actions Panel */}
				<div className="dashboard-panel quick-actions-panel">
					<h2>Quick Actions</h2>
					<div className="actions-grid">
						<Link to="/admin/menu" className="action-card">
							<span className="action-icon">🍔</span>
							<div className="action-details">
								<h3>Manage Menu</h3>
								<p>Add or edit items</p>
							</div>
						</Link>
						<Link to="/admin/orders" className="action-card">
							<span className="action-icon">📦</span>
							<div className="action-details">
								<h3>View Orders</h3>
								<p>Track delivery status</p>
							</div>
						</Link>
						<Link to="/admin/offers" className="action-card">
							<span className="action-icon">🏷️</span>
							<div className="action-details">
								<h3>Create Offer</h3>
								<p>Boost sales now</p>
							</div>
						</Link>
						<Link to="/admin/reports" className="action-card">
							<span className="action-icon">📈</span>
							<div className="action-details">
								<h3>View Reports</h3>
								<p>Check analytics</p>
							</div>
						</Link>
					</div>
				</div>
			</div>
			</div>
		</>
	);
}

export default Dashboard;
