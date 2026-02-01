

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import groceryService from '../../services/groceryService';
import './Orders.css';

const orderTabs = [
	{ label: 'All', key: 'all' },
	{ label: 'Pending', key: 'pending' },
	{ label: 'Confirmed', key: 'confirmed' },
	{ label: 'Preparing', key: 'preparing' },
	{ label: 'Out for Delivery', key: 'out_for_delivery' },
	{ label: 'Delivered', key: 'delivered' },
	{ label: 'Cancelled', key: 'cancelled' },
];

const statusColors = {
	pending: '#f59e0b',
	confirmed: '#3b82f6',
	preparing: '#8b5cf6',
	out_for_delivery: '#f97316',
	delivered: '#22c55e',
	cancelled: '#ef4444',
};

export default function Orders() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState('all');

	useEffect(() => {
		fetchOrders();
		// eslint-disable-next-line
	}, []);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const response = await groceryService.getOrders();
			const ordersData = response?.orders || response?.data?.orders || response || [];
			setOrders(Array.isArray(ordersData) ? ordersData : []);
		} catch (e) {
			console.error(e);
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (id, status) => {
		await groceryService.updateOrderStatus(id, status);
		fetchOrders();
	};

	const filteredOrders =
		tab === 'all' ? orders : orders.filter(o => (o.status || '').toLowerCase() === tab);

	return (
		<>
			<Navbar />
			<div className="orders-page">
				{/* HEADER */}
				<div className="orders-header">
					<div className="orders-title-box">
						<span className="orders-icon"><img src="/manageorder.png" alt="Manage Orders" className="orders-emoji" style={{ width: '70px', height: '70px', marginRight: '20px', background: 'none', boxShadow: 'none', borderRadius: 0 }} /></span>
						<div>
							<h1>Manage Orders</h1>
							<p>
								{orders.length} total ·{' '}
								{orders.filter(o => (o.status || '').toLowerCase() === 'pending').length} pending action
							</p>
						</div>
					</div>
				</div>

				{/* TABS */}
				<div className="orders-tabs">
					{orderTabs.map(t => (
						<button
							key={t.key}
							className={`orders-tab ${tab === t.key ? 'active' : ''}`}
							onClick={() => setTab(t.key)}
						>
							{t.label}
							<span className="tab-count">
								{t.key === 'all'
									? orders.length
									: orders.filter(o => (o.status || '').toLowerCase() === t.key).length}
							</span>
						</button>
					))}
				</div>

				{/* CONTENT */}
				{loading ? (
					<div className="orders-loading">Loading orders…</div>
				) : filteredOrders.length === 0 ? (
					<div className="orders-empty">
						<p>No orders found</p>
					</div>
				) : (
					<div className="orders-grid">
						{filteredOrders.map(order => (
							<div className="order-card" key={order.id}>
								{/* CARD HEADER */}
								<div className="order-card-top">
									<span className="order-id">
										#{order.order_number || order.id}
									</span>
									<span
										className="order-status"
										style={{
											background: statusColors[(order.status || '').toLowerCase()] + '22',
											color: statusColors[(order.status || '').toLowerCase()],
										}}
									>
										{(order.status || '').replaceAll('_', ' ').toUpperCase()}
									</span>
								</div>

								{/* CUSTOMER */}
								<div className="order-section">
									<div>👤 {order.customer_name || 'N/A'}</div>
									<div>📞 {order.customer_phone || 'N/A'}</div>
									{order.delivery_address && (
										<div>📍 {order.delivery_address}</div>
									)}
								</div>

								{/* ITEMS */}
								<div className="order-items">
									{order.items?.map((item, i) => (
										<div className="order-item" key={i}>
											<span className="qty">{item.quantity}×</span>
											<span className="name">{item.name}</span>
											<span className="price">₹{item.price}</span>
										</div>
									))}
								</div>

								{/* SUMMARY */}
								<div className="order-summary">
									<div>
										Total <b>₹{order.total_amount}</b>
									</div>
								</div>

								{/* ACTIONS */}
								<div className="order-actions">
									{(order.status || '').toLowerCase() === 'pending' && (
										<>
											<button
												className="btn success"
												onClick={() => handleStatusChange(order.id, 'confirmed')}
											>
												Confirm
											</button>
											<button
												className="btn danger"
												onClick={() => handleStatusChange(order.id, 'cancelled')}
											>
												Cancel
											</button>
										</>
									)}

									{(order.status || '').toLowerCase() === 'confirmed' && (
										<button
											className="btn primary"
											onClick={() => handleStatusChange(order.id, 'preparing')}
										>
											Start Preparing
										</button>
									)}

									{(order.status || '').toLowerCase() === 'preparing' && (
										<button
											className="btn warning"
											onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
										>
											Ready for Delivery
										</button>
									)}

									{(order.status || '').toLowerCase() === 'out_for_delivery' && (
										<button
											className="btn success"
											onClick={() => handleStatusChange(order.id, 'delivered')}
										>
											Mark Delivered
										</button>
									)}
								</div>

								{/* FOOTER */}
								<div className="order-footer">
									{order.created_at && new Date(order.created_at).toLocaleString()}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
}
