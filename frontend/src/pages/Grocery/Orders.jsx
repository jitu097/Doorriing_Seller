
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Orders.css';
import groceryService from '../../services/groceryService';

const orderTabs = [
	{ label: 'All', key: 'all' },
	{ label: 'Pending', key: 'Pending' },
	{ label: 'Confirmed', key: 'Confirmed' },
	{ label: 'Preparing', key: 'Preparing' },
	{ label: 'Out for Delivery', key: 'OutForDelivery' },
	{ label: 'Delivered', key: 'Delivered' },
	{ label: 'Cancelled', key: 'Cancelled' },
];

const statusColors = {
	Preparing: '#22d06a',
	Pending: '#3b82f6',
	Confirmed: '#f59e42',
	OutForDelivery: '#f7931e',
	Delivered: '#22d06a',
	Cancelled: '#dc2626',
};

const statusLabels = {
	Preparing: 'PREPARING',
	Pending: 'PENDING',
	Confirmed: 'CONFIRMED',
	OutForDelivery: 'OUT FOR DELIVERY',
	Delivered: 'DELIVERED',
	Cancelled: 'CANCELLED',
};

export default function Orders() {
	const [tab, setTab] = useState('all');
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	useEffect(() => {
		const fetchOrders = async () => {
			setLoading(true);
			try {
				const filters = {};
				if (tab !== 'all') {
					filters.status = tab;
				}
				const response = await groceryService.getOrders(filters);
				// Handle both structure types if response wraps data differently
				// service returns "api(...)" which usually returns json.
				// backend order.service.js returns { orders: [], pagination: {} }

				const ordersData = response.data?.orders || response.orders || [];
				setOrders(ordersData);
			} catch (err) {
				console.error("Failed to fetch orders:", err);
				setError("Failed to load orders");
			} finally {
				setLoading(false);
			}
		};

		fetchOrders();
	}, [tab, refreshTrigger]);

	const handleStatusUpdate = async (orderId, newStatus) => {
		try {
			// Optimistic update could be done here, but safe to just refresh
			await groceryService.updateOrderStatus(orderId, newStatus);
			setRefreshTrigger(prev => prev + 1);
		} catch (err) {
			alert("Failed to update status: " + err.message);
		}
	};

	// Determine available actions based on status
	const getActions = (order) => {
		const status = order.status;
		if (status === 'Pending') return ['Confirmed', 'Cancelled'];
		if (status === 'Confirmed') return ['Preparing', 'Cancelled'];
		if (status === 'Preparing') return ['OutForDelivery'];
		if (status === 'OutForDelivery') return ['Delivered'];
		return [];
	};

	const formatDate = (dateString) => {
		if (!dateString) return '';
		return new Date(dateString).toLocaleString('en-IN');
	};

	return (
		<>
			<Navbar />
			<div className="orders-container">
				<div className="orders-header">
					<span className="orders-emoji">🛒</span>
					<div>
						<h1 className="orders-title">Manage Orders</h1>
						<div className="orders-overview">
							{/* Note: This count is only for current tab/page unless we fetch separate stats */}
							<b>{orders.length} Orders</b> in current view
						</div>
					</div>
				</div>
				{error && <div className="error-message">{error}</div>}

				<div className="orders-tabs">
					{orderTabs.map(t => (
						<button
							key={t.key}
							className={"orders-tab" + (tab === t.key ? ' active' : '')}
							onClick={() => setTab(t.key)}
						>
							{t.label}
						</button>
					))}
				</div>

				<div className="orders-list">
					{loading ? (
						<div className="loading-state">Loading orders...</div>
					) : orders.length === 0 ? (
						<div className="empty-state">No orders found in this category.</div>
					) : (
						orders.map((order) => (
							<div className="order-card" key={order.id}>
								<div className="order-card-header">
									<span className="order-id">#{order.order_number}</span>
									<span className="order-status" style={{ background: (statusColors[order.status] || '#ccc') + '22', color: (statusColors[order.status] || '#666') }}>
										{statusLabels[order.status] || order.status.toUpperCase()}
									</span>
								</div>

								<div className="order-customer">
									<div><span role="img" aria-label="user">👤</span> {order.customer_name}</div>
									<div><span role="img" aria-label="phone">📞</span> {order.customer_phone}</div>
									<div><span role="img" aria-label="address">📍</span> {order.delivery_address}</div>
									<div>Payment: {order.payment_method || 'COD'} ({order.payment_status})</div>
									{order.customer_notes && <div>Has Notes 📝</div>}
								</div>

								{/* Order Items would ideally be fetched in detail or if standard list includes summary */}
								{/* The 'getOrders' list usually returns summary. Detailed items need getOrderDetails or special expand.*/}
								{/* For MVP list view, if items are not in list response, we might just show total items or fetch on expand.*/}
								{/* order.service.js getOrders returns basic info but NOT items array. */}
								{/* We will show a "View Details" button or generic summary if items are missing. */}
								{/* Ideally we want to see items. Let's assume we need to click to view or fetch details.*/}
								{/* MODIFY: For this MVP, let's just show total items count and price as the list doesn't return items array.*/}

								<div className="order-summary">
									<div>Total Amount <b>₹{order.total_amount}</b></div>
									<div>Delivery Charge <b>₹{order.delivery_charge}</b></div>
								</div>

								<div className="order-actions">
									{getActions(order).map(action => (
										<button
											key={action}
											className={"order-action-btn " + action.toLowerCase()}
											onClick={() => handleStatusUpdate(order.id, action)}
										>
											{action === 'OutForDelivery' ? 'Out for Delivery' : action}
										</button>
									))}
								</div>

								<div className="order-footer">
									<span>{formatDate(order.created_at)}</span>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	);
}
