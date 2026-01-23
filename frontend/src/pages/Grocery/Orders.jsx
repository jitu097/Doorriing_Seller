
import React, { useState } from 'react';
import Navbar from './Navbar';
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

const sampleOrders = [
	{
		id: 'grc1a2b3...',
		status: 'preparing',
		customer: {
			name: 'Amit Kumar',
			phone: '9876543210',
			email: 'amitkumar@email.com',
			address: '123 Main St, City, State, Mobile: 9876543210',
		},
		payment: 'Online',
		items: [
			{ name: 'Rice', qty: 2, type: 'Kg', price: 80, img: '' },
			{ name: 'Wheat', qty: 1, type: 'Kg', price: 50, img: '' },
			{ name: 'Oil', qty: 1, type: 'Litre', price: 120, img: '' },
		],
		subtotal: 230,
		delivery: 30,
		total: 260,
		driver: '',
		created: '23/1/2026, 10:15:00 am',
		actions: ['Assign Driver'],
	},
	{
		id: 'grc4d5e6...',
		status: 'pending',
		customer: {
			name: 'Priya Sharma',
			phone: '9123456780',
			email: 'priyasharma@email.com',
			address: '456 Market Rd, City, State, Mobile: 9123456780',
		},
		payment: 'COD',
		items: [
			{ name: 'Sugar', qty: 3, type: 'Kg', price: 40, img: '' },
			{ name: 'Salt', qty: 2, type: 'Kg', price: 20, img: '' },
		],
		subtotal: 160,
		delivery: 20,
		total: 180,
		driver: '',
		created: '22/1/2026, 4:45:00 pm',
		actions: ['Accept', 'Reject'],
	},
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
	const [tab, setTab] = useState('all');
	const orders = tab === 'all' ? sampleOrders : sampleOrders.filter(o => o.status === tab);

	return (
		<>
			<Navbar />
			<div className="orders-container">
				<div className="orders-header">
					<span className="orders-emoji">🛒</span>
					<div>
						<h1 className="orders-title">Manage Orders</h1>
						<div className="orders-overview">Overview: <b>{sampleOrders.length} Total</b> | <b>{sampleOrders.filter(o => o.status === 'pending').length} Pending Action</b></div>
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
					{orders.map((order, i) => (
						<div className="order-card" key={order.id}>
							<div className="order-card-header">
								<span className="order-id">#{order.id}</span>
								<span className="order-status" style={{ background: statusColors[order.status] + '22', color: statusColors[order.status] }}>{statusLabels[order.status]}</span>
							</div>
							<div className="order-customer">
								<div><span role="img" aria-label="user">👤</span> {order.customer.name}</div>
								<div><span role="img" aria-label="phone">📞</span> {order.customer.phone}</div>
								<div><span role="img" aria-label="email">📧</span> {order.customer.email}</div>
								<div><span role="img" aria-label="address">📍</span> {order.customer.address}</div>
								<div>Payment: {order.payment}</div>
							</div>
							<div className="order-items">
								{order.items.map((item, idx) => (
									<div className="order-item" key={item.name + idx}>
										{item.img && <img src={item.img} alt={item.name} className="order-item-img" />}
										<span className="order-item-qty">{item.qty}x</span>
										<span className="order-item-name">{item.name}</span>
										<span className="order-item-type">({item.type})</span>
										<span className="order-item-price">₹{item.price}</span>
									</div>
								))}
							</div>
							<div className="order-summary">
								<div>Subtotal <b>₹{order.subtotal}</b></div>
								<div>Delivery Charge <b>₹{order.delivery}</b></div>
								<div>Total Amount <b>₹{order.total}</b></div>
								<div>Delivery Partner: <span className="order-driver">{order.driver || 'Not Assigned'}</span></div>
							</div>
							<div className="order-actions">
								{order.actions.map(action => (
									<button key={action} className={"order-action-btn " + action.toLowerCase().replace(/ /g, '-')}>{action}</button>
								))}
							</div>
							<div className="order-footer">
								<span>{order.created}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
