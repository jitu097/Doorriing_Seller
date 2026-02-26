
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import groceryService from '../../services/groceryService';

function Dashboard() {
	const [stats, setStats] = useState({
		totalOrders: 0,
		totalRevenue: 0,
		pendingOrders: 0,
		confirmedOrders: 0,
		preparingOrders: 0,
		outForDelivery: 0,
		deliveredOrders: 0,
		cancelledOrders: 0
	});
	const [recentOrders, setRecentOrders] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const [statsData, ordersData] = await Promise.all([
					groceryService.getDashboardStats(), // Map to orderStats or summary
					groceryService.getOrders({ limit: 5 })
				]);

				// transform stats if needed. groceryService.getDashboardStats maps to analytics summary
				// actually getOrderStats is better for "active" counts.
				// Let's call getOrderStats as well for real-time counts.
				// Re-calling to get real-time status counts
				const statusCounts = await groceryService.getOrderStats();

				// Merge data
				setStats({
					...statusCounts,
					totalOrders: statsData.totalOrders || 0,
					totalRevenue: statsData.totalRevenue || 0, // Backend summary keys are camelCase
					delivered: statsData.completedOrders || statusCounts.delivered || 0
				});

				const orders = ordersData.data?.orders || ordersData.orders || [];
				setRecentOrders(orders);
			} catch (error) {
				console.error("Error fetching dashboard data", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	const activeOrdersCount = (stats.pending || 0) + (stats.confirmed || 0) + (stats.preparing || 0) + (stats.outForDelivery || 0);

	return (
		<>
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
						<div className="stat-icon revenue-icon"><img src="/potli.png" alt="Total Revenue" style={{ width: 40, height: 40 }} /></div>
						<div className="stat-info">
							<h3>Total Revenue</h3>
							<p className="stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
							<span className="stat-hint">Lifetime earnings</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon orders-icon"><img src="/checkout.png" alt="Active Orders" style={{ width: 40, height: 40 }} /></div>
						<div className="stat-info">
							<h3>Active Orders</h3>
							<p className="stat-value">{activeOrdersCount}</p>
							<span className="stat-hint">In preparation or delivery</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon success-icon"><img src="/delivered.png" alt="Delivered" style={{ width: 40, height: 40 }} /></div>
						<div className="stat-info">
							<h3>Delivered</h3>
							<p className="stat-value">{stats.delivered || 0}</p>
							<span className="stat-hint">Successfully served</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon cancel-icon"><img src="/cancel.png" alt="Cancelled" style={{ width: 40, height: 40 }} /></div>
						<div className="stat-info">
							<h3>Cancelled</h3>
							<p className="stat-value">{stats.cancelled || 0}</p>
							<span className="stat-hint">Total cancellations</span>
						</div>
					</div>
				</div>

				<div className="dashboard-content-grid">
					{/* Recent Orders Panel */}
					<div className="dashboard-panel recent-orders">
						<div className="panel-header">
							<h2>Recent Orders</h2>
							<Link to="/grocery/orders" className="view-all-link">View All Orders</Link>
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
									{loading ? (
										<tr><td colSpan="4">Loading...</td></tr>
									) : recentOrders.length === 0 ? (
										<tr><td colSpan="4" className="empty-state">No recent orders found</td></tr>
									) : (
										recentOrders.map(order => (
											<tr key={order.id}>
												<td className="order-id">#{order.order_number}</td>
												<td>
													<span className={`status-badge ${(order.status || '').toLowerCase()}`}>
														{order.status}
													</span>
												</td>
												<td className="amount">₹{order.total_amount}</td>
												<td className="time">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
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
}

export default Dashboard;
