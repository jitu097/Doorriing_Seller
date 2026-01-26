import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import orderService from '../../services/orderService';
import './Orders.css';

const orderTabs = [
	{ label: 'All', key: 'all' },
	{ label: 'Pending', key: 'pending' },
	{ label: 'Confirmed', key: 'confirmed' },
	{ label: 'Preparing', key: 'preparing' },
	{ label: 'Out for Delivery', key: 'out' },
	{ label: 'Delivered', key: 'delivered' },
	{ label: 'Cancelled', key: 'cancelled' },
];

const statusColors = {
	preparing: '#22d06a',
	pending: '#3b82f6',
	confirmed: '#f59e42',
	out: '#f7931e',
	delivered: '#22d06a',
	cancelled: '#dc2626',
};

const statusLabels = {
	preparing: 'PREPARING',
	pending: 'PENDING',
	confirmed: 'CONFIRMED',
	out: 'OUT FOR DELIVERY',
	delivered: 'DELIVERED',
	cancelled: 'CANCELLED',
};

export default function Orders() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState('all');

	useEffect(() => {
		fetchOrders();
	}, []);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const data = await orderService.getOrders();
			setOrders(data || []);
		} catch (error) {
			console.error('Failed to fetch orders:', error);
			// Set empty array on error - backend may not be running
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (orderId, newStatus) => {
		try {
			await orderService.updateOrderStatus(orderId, newStatus);
			// Refresh orders after status update
			fetchOrders();
		} catch (error) {
			console.error('Failed to update order status:', error);
			alert('Failed to update order status. Please try again.');
		}
	};

	if (loading) {
		return (
			<>
				<Navbar />
				<div className="loading">Loading orders...</div>
			</>
		);
	}

	const filteredOrders = tab === 'all' ? orders : orders.filter(o => o.status === tab);

	return (
		<>
			<Navbar />
			<div className="orders-container">
				<div className="orders-header">
					<span className="orders-emoji">📦</span>
					<div>
						<h1 className="orders-title">Manage Orders</h1>
						<div className="orders-overview">
							Overview: <b>{orders.length} Total</b> | 
							<b> {orders.filter(o => o.status === 'pending').length} Pending Action</b>
						</div>
					</div>
				</div>
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
					{filteredOrders.length === 0 ? (
						<div className="no-orders">No orders found</div>
					) : (
						filteredOrders.map((order) => (
							<div className="order-card" key={order.id}>
								<div className="order-card-header">
									<span className="order-id">#{order.order_number || order.id}</span>
									<span className="order-status" style={{ 
										background: statusColors[order.status] + '22', 
										color: statusColors[order.status] 
									}}>
										{statusLabels[order.status] || order.status?.toUpperCase()}
									</span>
								</div>
								<div className="order-customer">
									<div><span role="img" aria-label="user">👤</span> {order.customer_name || 'N/A'}</div>
									<div><span role="img" aria-label="phone">📞</span> {order.customer_phone || 'N/A'}</div>
									{order.customer_email && <div><span role="img" aria-label="email">📧</span> {order.customer_email}</div>}
									{order.delivery_address && <div><span role="img" aria-label="address">📍</span> {order.delivery_address}</div>}
									<div>Payment: {order.payment_method || 'COD'}</div>
								</div>
								<div className="order-items">
									{order.items?.map((item, idx) => (
										<div className="order-item" key={idx}>
											{item.image_url && <img src={item.image_url} alt={item.name} className="order-item-img" />}
											<span className="order-item-qty">{item.quantity}x</span>
											<span className="order-item-name">{item.name}</span>
											{item.portion && <span className="order-item-type">({item.portion})</span>}
											<span className="order-item-price">₹{item.price}</span>
										</div>
									))}
								</div>
								<div className="order-summary">
									<div>Subtotal <b>₹{order.subtotal || order.total_amount}</b></div>
									{order.delivery_charge && <div>Delivery Charge <b>₹{order.delivery_charge}</b></div>}
									<div>Total Amount <b>₹{order.total_amount}</b></div>
									{order.delivery_partner && <div>Delivery Partner: <span className="order-driver">{order.delivery_partner}</span></div>}
								</div>
								<div className="order-actions">
									{order.status === 'pending' && (
										<>
											<button 
												className="order-action-btn confirm"
												onClick={() => handleStatusChange(order.id, 'confirmed')}
											>
												Confirm
											</button>
											<button 
												className="order-action-btn reject"
												onClick={() => handleStatusChange(order.id, 'cancelled')}
											>
												Cancel
											</button>
										</>
									)}
									{order.status === 'confirmed' && (
										<button 
											className="order-action-btn preparing"
											onClick={() => handleStatusChange(order.id, 'preparing')}
										>
											Start Preparing
										</button>
									)}
									{order.status === 'preparing' && (
										<button 
											className="order-action-btn ready"
											onClick={() => handleStatusChange(order.id, 'out_for_delivery')}
										>
											Mark Ready
										</button>
									)}
									{order.status === 'out_for_delivery' && (
										<button 
											className="order-action-btn deliver"
											onClick={() => handleStatusChange(order.id, 'delivered')}
										>
											Mark Delivered
										</button>
									)}
								</div>
								<div className="order-footer">
									<span>{new Date(order.created_at).toLocaleString()}</span>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	);
}
