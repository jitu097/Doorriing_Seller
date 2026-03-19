import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../Restaurant/Dashboard.css';
import { analyticsService } from '../../services/analyticsService';
import orderService from '../../services/orderService';
import { bookingService } from '../../services/bookingService';
import walletService from '../../services/walletService';
import { shopService } from '../../services/shopService';
import Loader from '../../components/common/Loader';
import { useOrderInsertRealtime } from '../../hooks/useOrderInsertRealtime';
import { mergeFetchedOrders, upsertOrderAtTop } from '../../utils/orderRealtime';

function Dashboard() {
	const [stats, setStats] = useState(null);
	const [recentOrders, setRecentOrders] = useState([]);
	const [todayBookings, setTodayBookings] = useState([]);
	const [walletData, setWalletData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isBookingEnabled, setIsBookingEnabled] = useState(false);
	const [bookingToggleLoading, setBookingToggleLoading] = useState(false);

	const fetchDashboardData = useCallback(async ({ silent = false } = {}) => {
		try {
			if (!silent) {
				setLoading(true);
			}

			// Run all independent requests in parallel
			const [data, wallet, ordersData, shop] = await Promise.all([
				analyticsService.getSummary(7),
				walletService.getWalletSummary(),
				orderService.getOrders({ limit: 5 }),
				shopService.getCurrentShop()
			]);

			setStats(data);
			setWalletData(wallet);

			if (ordersData && ordersData.orders) {
				if (silent) {
					setRecentOrders((prevOrders) => mergeFetchedOrders(ordersData.orders, prevOrders, 5));
				} else {
					setRecentOrders(ordersData.orders);
				}
			}

			const bookingEnabled = shop?.is_booking_enabled === true;
			setIsBookingEnabled(bookingEnabled);

			// Only fetch bookings if the shop has booking enabled
			if (bookingEnabled) {
				const bookingsData = await bookingService.getTodayBookings();
				setTodayBookings(bookingsData || []);
			}
		} catch (error) {
			console.error('Failed to fetch dashboard data:', error);
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
			console.log('[Dashboard][restaurant] realtime insert', incomingOrder);
		}

		void (async () => {
			try {
				const orderData = await orderService.getOrderById(incomingOrder.id);
				const hydratedOrder = orderData?.order || orderData?.data || orderData;

				setRecentOrders((prevOrders) => upsertOrderAtTop(prevOrders, hydratedOrder, 5));
			} catch (error) {
				console.error('Failed to hydrate realtime restaurant order', error);
				setRecentOrders((prevOrders) => upsertOrderAtTop(prevOrders, incomingOrder, 5));
			} finally {
				void fetchDashboardData({ silent: true });
			}
		})();
	}, [fetchDashboardData]);

	useOrderInsertRealtime(handleRealtimeOrderInsert);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	if (loading) {
		return <Loader variant="fullscreen" message="Loading dashboard..." />;
	}

	const handleBookingToggle = async () => {
		try {
			setBookingToggleLoading(true);
			const newValue = !isBookingEnabled;
			await bookingService.toggleBookingStatus(newValue);
			setIsBookingEnabled(newValue);
		} catch (error) {
			console.error('Failed to toggle booking status:', error);
			alert('Failed to update booking settings. Please try again.');
		} finally {
			setBookingToggleLoading(false);
		}
	};

	const activeOrdersCount = (stats?.pending_orders || 0);
	const totalRevenue = walletData?.balance || 0;
	const deliveredOrders = stats?.completed_orders || 0;
	const cancelledOrders = stats?.cancelled_orders || 0;
	return (
		<>
			<div className="admin-container">
				<header className="admin-header">
					<div className="header-content">
						<h1>Dashboard</h1>
						<p>Welcome back! Here's your daily overview.</p>
					</div>
					<div className="header-actions">
						<span className="date-badge">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
					</div>
				</header>

				{/* Stats Grid */}
				<div className="stats-grid">
					<div className="stat-card">
						<div className="stat-icon revenue-icon">
							<img src="/potli.png" alt="Potli" style={{ width: '2.2rem', height: '2.2rem', objectFit: 'contain' }} />
						</div>
						<div className="stat-info">
							<h3>Total Revenue</h3>
							<p className="stat-value">₹{totalRevenue.toLocaleString()}</p>
							<span className="stat-hint">Lifetime earnings</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon orders-icon">
							<img src="/checkout.png" alt="Checkout" style={{ width: '2.2rem', height: '2.2rem', objectFit: 'contain' }} />
						</div>
						<div className="stat-info">
							<h3>Active Orders</h3>
							<p className="stat-value">{activeOrdersCount}</p>
							<span className="stat-hint">In preparation or delivery</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon success-icon">
							<img src="/delivered.png" alt="Delivered" style={{ width: '2.2rem', height: '2.2rem', objectFit: 'contain' }} />
						</div>
						<div className="stat-info">
							<h3>Delivered</h3>
							<p className="stat-value">{deliveredOrders}</p>
							<span className="stat-hint">Successfully served</span>
						</div>
					</div>

					<div className="stat-card">
						<div className="stat-icon cancel-icon">
							<img src="/cancel.png" alt="Cancelled" style={{ width: '2.2rem', height: '2.2rem', objectFit: 'contain' }} />
						</div>
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
											<tr key={order.id}>
												<td className="order-id">#{order.id.substring(0, 8)}...</td>
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



					{/* Upcoming Bookings Panel - Conditionally Rendered */}
					{isBookingEnabled && (
						<div className="dashboard-panel today-bookings">
							<div className="panel-header">
								<h2>Upcoming Bookings</h2>
								<Link to="/restaurant/bookings" className="view-all-link">View All Bookings</Link>
							</div>
							<div className="bookings-list-dashboard">
								{todayBookings.length === 0 ? (
									<div className="empty-state">No bookings for today</div>
								) : (
									todayBookings.slice(0, 4).map(booking => (
										<div key={booking.id} className="booking-item">
											<div className="booking-time">
												<span className="time-icon">🕒</span>
												<span className="time-value">{booking.booking_time}</span>
											</div>
											<div className="booking-details">
												<div className="customer-name">{booking.customer_name}</div>
												<div className="booking-meta">
													<span>👥 {booking.number_of_guests} guests</span>
													<span>📞 {booking.customer_phone}</span>
												</div>
											</div>
											<div className="booking-status">
												<span className={`status-badge ${(booking.status || '').toLowerCase()}`}>
													{booking.status}
												</span>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}

					{/* Quick Actions Panel */}

				</div>
			</div>
		</>
	);
}

export default Dashboard;
