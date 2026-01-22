import React, { useEffect, useState } from 'react';
import './Orders.css';

const mockOrders = [];
// Example: populate with mock data if needed
// for (let i = 1; i <= 0; i++) mockOrders.push({ id: i, customer: 'Customer ' + i, amount: 100 + i, status: 'Pending', date: '2026-01-22', });

const statusOptions = ['All Status', 'Pending', 'Completed', 'Cancelled'];

const Orders = () => {
	const [orders, setOrders] = useState(mockOrders);
	const [status, setStatus] = useState('All Status');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const pageSize = 10;

	// Filtered and searched orders
	const filteredOrders = orders.filter(order => {
		const matchesStatus = status === 'All Status' || order.status === status;
		const matchesSearch = order.customer?.toLowerCase().includes(search.toLowerCase()) || order.id.toString().includes(search);
		return matchesStatus && matchesSearch;
	});
	const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
	const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

	useEffect(() => { setPage(1); }, [status, search]);

	return (
		<div className="orders-container">
			<div className="orders-header-row">
				<h2>All Orders</h2>
				<div className="orders-controls">
					<select value={status} onChange={e => setStatus(e.target.value)}>
						{statusOptions.map(opt => <option key={opt}>{opt}</option>)}
					</select>
					<input
						type="text"
						placeholder="Search orders..."
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
				</div>
			</div>
			<div className="orders-table-wrapper">
				<table className="orders-table">
					<thead>
						<tr>
							<th>ORDER ID</th>
							<th>CUSTOMER</th>
							<th>AMOUNT</th>
							<th>STATUS</th>
							<th>DATE</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{paginatedOrders.length === 0 ? (
							<tr><td colSpan={6} className="no-orders">No orders found</td></tr>
						) : paginatedOrders.map(order => (
							<tr key={order.id}>
								<td>{order.id}</td>
								<td>{order.customer}</td>
								<td>${order.amount}</td>
								<td><span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span></td>
								<td>{order.date}</td>
								<td><button className="view-btn">View</button></td>
							</tr>
						))}
					</tbody>
				</table>
				<div className="orders-pagination-row">
					<span>Showing {(filteredOrders.length === 0 ? 0 : (page - 1) * pageSize + 1)}-{Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</span>
					<div className="pagination-controls">
						<button disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</button>
						<span>{page}</span>
						<button disabled={page === totalPages} onClick={() => setPage(page + 1)}>&gt;</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Orders;
