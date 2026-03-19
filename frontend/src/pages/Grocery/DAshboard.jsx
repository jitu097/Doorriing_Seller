import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import groceryService from '../../services/groceryService';
import walletService from '../../services/walletService';
import Loader from '../../components/common/Loader';
import { useOrderInsertRealtime } from '../../hooks/useOrderInsertRealtime';
import orderService from '../../services/orderService';
import { mergeFetchedOrders, upsertOrderAtTop } from '../../utils/orderRealtime';

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
	const [walletData, setWalletData] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchDashboardData = useCallback(async ({ silent = false } = {}) => {
		try {
			if (!silent) {
				setLoading(true);
			}

			const [statsData, ordersData, statusCounts, wallet] = await Promise.all([
				groceryService.getDashboardStats(),
				groceryService.getOrders({ limit: 5 }),
				groceryService.getOrderStats(),
				walletService.getWalletSummary()
			]);

			setWalletData(wallet);

			setStats({
				pending: statusCounts.pending || 0,
				confirmed: statusCounts.confirmed || 0,
				preparing: statusCounts.preparing || 0,
				outForDelivery: statusCounts.outForDelivery || 0,
				delivered: statusCounts.delivered || 0,
				cancelled: statusCounts.cancelled || 0,
				totalOrders: statsData.totalOrders || 0,
				totalRevenue: statsData.totalRevenue || 0
			});

			const orders = ordersData.data?.orders || ordersData.orders || [];
			if (silent) {
				setRecentOrders((prevOrders) => mergeFetchedOrders(orders, prevOrders, 5));
			} else {
				setRecentOrders(orders);
			}
		} catch (error) {
			console.error('Error fetching dashboard data', error);
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	}, []);

	const handleRealtimeOrderInsert = useCallback((payload) => {
		const incomingOrder = payload?.new;
		if (!incomingOrder?.id) {
			return;
		}

		if (import.meta.env.DEV) {
			console.log('[Dashboard][grocery] realtime insert', incomingOrder);
		}

		void (async () => {
			try {
				const orderData = await orderService.getOrderById(incomingOrder.id);
				const hydratedOrder = orderData?.order || orderData?.data || orderData;

				setRecentOrders((prevOrders) => upsertOrderAtTop(prevOrders, hydratedOrder, 5));
			} catch (error) {
				console.error('Failed to hydrate realtime grocery order', error);
				setRecentOrders((prevOrders) => upsertOrderAtTop(prevOrders, incomingOrder, 5));
			} finally {
				void fetchDashboardData({ silent: true });
			}
		})();
	}, [fetchDashboardData]);

	useOrderInsertRealtime(handleRealtimeOrderInsert);

	useEffect(() => {
		void fetchDashboardData();
	}, [fetchDashboardData]);

	if (loading) {
		return <Loader variant="fullscreen" message="Loading dashboard..." />;
	}

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
						<Link to="/grocery/products" className="manage-products-btn">Manage products</Link>
						<span className="date-badge">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
					</div>
				</header>

				<div className="stats-grid">
					<div className="stat-card">
						<div className="stat-icon revenue-icon"><img src="/potli.png" alt="Total Revenue" style={{ width: 40, height: 40 }} /></div>
						<div className="stat-info">
							<h3>Total Revenue</h3>
							<p className="stat-value">â‚¹{(walletData?.balance || 0).toLocaleString()}</p>
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
												<td className="amount">â‚¹{order.total_amount}</td>
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
