import React, { useEffect, useState, Suspense, lazy } from 'react';
const GroceryOrders = lazy(() => import('./Orders'));
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
	const [shop, setShop] = useState(null);
	const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, products: 0 });
	const [recentOrders, setRecentOrders] = useState([]);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState('overview');
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				// Fetch shop details
				const shopRes = await axios.get(`${API_BASE}/api/shop/me`, { withCredentials: true });
				setShop(shopRes.data);

				// Fetch dashboard stats
				const statsRes = await axios.get(`${API_BASE}/api/shop/dashboard-stats`, { withCredentials: true });
				setStats(statsRes.data);

				// Fetch recent orders
				const ordersRes = await axios.get(`${API_BASE}/api/orders/recent`, { withCredentials: true });
				setRecentOrders(ordersRes.data);

				// Fetch products
				const productsRes = await axios.get(`${API_BASE}/api/products`, { withCredentials: true });
				setProducts(productsRes.data);
			} catch (err) {
				// Handle error (show toast or fallback UI)
			}
			setLoading(false);
		};
		fetchData();
	}, []);

	const handleTab = (tabName) => setTab(tabName);
	const handleManageProducts = () => navigate('/grocery/products');
	const handleViewAllOrders = () => navigate('/orders');
	const handleReRegister = () => navigate('/onboarding/shop-setup');
	const handleSignOut = () => {
		axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true }).then(() => {
			navigate('/login');
		});
	};

	if (loading) return <div>Loading...</div>;

	return (
		<div className="dashboard-container">
			<header className="dashboard-header">
				<h2>Shop Dashboard <span className="status-badge">Active</span></h2>
				<div className="dashboard-actions">
					<button className="btn re-register" onClick={handleReRegister}>Re-register Shop (Trial)</button>
					<button className="btn signout" onClick={handleSignOut}>Sign Out</button>
				</div>
			</header>
			<section className="shop-info">
				<div className="shop-card">
					<h3>{shop?.name || 'Shop Name'}</h3>
					<div>Owner: {shop?.ownerName || '-'} &bull; {shop?.category || '-'}</div>
					<div>Joined: {shop?.createdAt ? new Date(shop.createdAt).toLocaleDateString() : '-'}</div>
					<div className="shop-rating">★ {shop?.rating || 0} <span>Rating</span></div>
				</div>
			</section>
			<nav className="dashboard-tabs">
				{['overview', 'orders', 'products', 'analytics', 'settings'].map(t => (
					<span
						key={t}
						className={tab === t ? 'active' : ''}
						onClick={() => {
							if (t === 'products') {
								navigate('/grocery/products');
							} else {
								handleTab(t);
							}
						}}
					>
						{t.charAt(0).toUpperCase() + t.slice(1)}
					</span>
				))}
			</nav>
			{tab === 'overview' && (
				<section className="dashboard-overview">
					<div className="stats-row">
						<div className="stat-card"><div>Today's Orders</div><div>{stats.orders}</div></div>
						<div className="stat-card"><div>Total Revenue</div><div>${stats.revenue.toFixed(2)}</div></div>
						<div className="stat-card"><div>Total Customers</div><div>{stats.customers}</div></div>
						<div className="stat-card"><div>Products</div><div>{stats.products}</div></div>
					</div>
					<div className="overview-row">
						<div className="recent-orders">
							<h4>Recent Orders</h4>
							{recentOrders.length === 0 ? <div>No recent orders</div> : (
								<ul>
									{recentOrders.map(order => (
										<li key={order.id}>
											<div>Order #{order.id} - {order.customerName}</div>
											<div>{order.status} - ${order.totalAmount}</div>
										</li>
									))}
								</ul>
							)}
							<button onClick={() => setTab('orders')}>View all orders →</button>
						</div>
						<div className="products-overview">
							<div className="products-header">
								<h4>Products Overview</h4>
								<button onClick={handleManageProducts}>Manage Products</button>
							</div>
							<div className="product-analysis">
								<h5>Product Analysis Dashboard</h5>
								<div className="stock-levels">
									<table>
										<thead><tr><th>Product</th><th>Stock</th></tr></thead>
										<tbody>
											{products.map(p => (
												<tr key={p.id}><td>{p.name}</td><td>{p.stock}</td></tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</section>
			)}
			{tab === 'orders' && (
				<Suspense fallback={<div>Loading Orders...</div>}>
					<GroceryOrders />
				</Suspense>
			)}
			{/* Implement other tabs as needed */}
		</div>
	);
};

export default Dashboard;
