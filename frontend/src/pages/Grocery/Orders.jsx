
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import orderService from '../../services/orderService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import Loader from '../../components/common/Loader';
import OrderCard from '../../components/Orders/OrderCard';
import './Orders.css';

const AssignDriverModal = lazy(() => import('../../components/Orders/AssignDriverModal'));

const logError = (scope, error) => {
	console.error(`[GroceryOrders] ${scope}`, error);
};

const orderTabs = [
	{ label: 'All', key: 'all' },
	{ label: 'Pending', key: 'pending' },
	{ label: 'Accepted', key: 'accepted' },
	{ label: 'Preparing', key: 'preparing' },
	{ label: 'Ready For Pickup', key: 'ready_for_pickup' },
	{ label: 'Picked Up', key: 'picked_up' },
	{ label: 'Out For Delivery', key: 'out_for_delivery' },
	{ label: 'Delivered', key: 'delivered' },
	{ label: 'Cancelled', key: 'cancelled' },
	{ label: 'Rejected', key: 'rejected' }
];

const statusMeta = {
	pending: { label: 'Pending', color: '#f59e0b' },
	accepted: { label: 'Accepted', color: '#3b82f6' },
	preparing: { label: 'Preparing', color: '#a855f7' },
	ready_for_pickup: { label: 'Ready for Pickup', color: '#0ea5e9' },
	picked_up: { label: 'Picked Up', color: '#6366f1' },
	out_for_delivery: { label: 'Out for Delivery', color: '#f97316' },
	delivered: { label: 'Delivered', color: '#22c55e' },
	cancelled: { label: 'Cancelled', color: '#ef4444' },
	rejected: { label: 'Rejected', color: '#ef4444' }
};

const initialPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

const ACTION_TYPES = {
	accept: 'accept',
	reject: 'reject',
	prepare: 'prepare',
	ready: 'ready',
	assign: 'assign-driver'
};


const STATUS_PRIORITY = {
	delivered: 7,
	out_for_delivery: 6,
	picked_up: 5,
	ready_for_pickup: 4,
	preparing: 3,
	accepted: 2,
	pending: 1,
	cancelled: 1,
	rejected: 1
};

const STATUS_ALIAS_MAP = {
	ready: 'ready_for_pickup',
	packing: 'preparing',
	pickedup: 'picked_up',
	outfordelivery: 'out_for_delivery',
	completed: 'delivered',
	dispatched: 'out_for_delivery',
	in_transit: 'out_for_delivery'
};

const normalizeStatusKey = (status) => {
	const lowered = status?.toString?.().toLowerCase?.() || '';
	return STATUS_ALIAS_MAP[lowered] || lowered;
};

const deriveDisplayStatus = (order = {}) => {
	const timeline = order.deliveryTimeline || {};
	const candidates = [order.status, timeline.status];

	if (timeline?.deliveredAt || order.delivered_at) candidates.push('delivered');
	if (timeline?.outForDeliveryAt || order.out_for_delivery_at) candidates.push('out_for_delivery');
	if (timeline?.pickedUpAt || order.picked_up_at) candidates.push('picked_up');
	if (order.ready_for_pickup_at) candidates.push('ready_for_pickup');

	const scored = candidates
		.filter(Boolean)
		.map(entry => normalizeStatusKey(entry))
		.filter(Boolean)
		.map(status => ({ status, score: STATUS_PRIORITY[status] || 0 }));

	if (!scored.length) return 'pending';
	return scored.sort((a, b) => b.score - a.score)[0].status;
};

export default function Orders() {
	const [orders, setOrders] = useState([]);
	const [statusFilter, setStatusFilter] = useState('all');
	const [pagination, setPagination] = useState(initialPagination);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [actionState, setActionState] = useState(null);
	const [driverModal, setDriverModal] = useState({ open: false, orderId: null });
	const [drivers, setDrivers] = useState([]);
	const [driversLoading, setDriversLoading] = useState(false);
	const [driversError, setDriversError] = useState(null);

	const statusRef = useRef(statusFilter);
	const pageRef = useRef(currentPage);
	const driversFetchGuard = useRef(false);

	useEffect(() => {
		statusRef.current = statusFilter;
	}, [statusFilter]);

	useEffect(() => {
		pageRef.current = currentPage;
	}, [currentPage]);

	const fetchOrders = useCallback(async ({ page, status, silent } = {}) => {
		const targetPage = page ?? pageRef.current;
		const targetStatus = status ?? statusRef.current;

		if (!silent) setLoading(true);
		setError(null);

		try {
			const response = await orderService.getOrders({ page: targetPage, status: targetStatus });
			const list = (Array.isArray(response?.orders) ? response.orders : []).map(order => {
				const computedStatus = deriveDisplayStatus(order);
				return { ...order, status: computedStatus, computedStatus };
			});
			const meta = response?.pagination || {};
			const nextMeta = {
				page: meta.page || targetPage,
				limit: meta.limit || initialPagination.limit,
				total: typeof meta.total === 'number' ? meta.total : list.length,
				totalPages: meta.totalPages || initialPagination.totalPages
			};

			setOrders(list);
			setPagination(nextMeta);
			setCurrentPage(nextMeta.page);
			statusRef.current = targetStatus;
			pageRef.current = nextMeta.page;
		} catch (err) {
			logError('fetchOrders', err);
			setOrders([]);
			setError(err?.message || 'Unable to load orders right now.');
		} finally {
			if (!silent) setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOrders({ page: 1, status: 'all' });
	}, [fetchOrders]);

	const refreshSilently = useCallback(() => fetchOrders({ silent: true }), [fetchOrders]);
	useRealtimeSubscription('orders', refreshSilently);

	useEffect(() => {
		window.addEventListener('order-alert-action', refreshSilently);
		return () => window.removeEventListener('order-alert-action', refreshSilently);
	}, [refreshSilently]);

	const fetchDrivers = useCallback(async () => {
		setDriversLoading(true);
		setDriversError(null);
		try {
			const response = await orderService.getActiveDeliveryPartners();
			setDrivers(Array.isArray(response) ? response : []);
		} catch (err) {
			logError('fetchDrivers', err);
			setDrivers([]);
			setDriversError(err?.message || 'Unable to load drivers');
		} finally {
			setDriversLoading(false);
		}
	}, []);

	useEffect(() => {
		if (driverModal.open && !driversFetchGuard.current && !drivers.length && !driversLoading) {
			driversFetchGuard.current = true;
			fetchDrivers();
		}
		if (!driverModal.open) {
			driversFetchGuard.current = false;
		}
	}, [driverModal.open, drivers.length, driversLoading, fetchDrivers]);

	const performOrderAction = useCallback(async (actionFn, type, orderId, options = {}) => {
		const { nextStatus } = options;
		const shouldForceTab = nextStatus && statusRef.current !== 'all';

		try {
			setActionState({ type, orderId });
			await actionFn();

			const fetchArgs = shouldForceTab ? { page: 1, status: nextStatus } : undefined;
			await fetchOrders(fetchArgs);

			if (shouldForceTab && nextStatus) {
				setStatusFilter(nextStatus);
				statusRef.current = nextStatus;
				setCurrentPage(1);
				pageRef.current = 1;
			}

			return true;
		} catch (err) {
			logError(type, err);
			setError(err?.message || 'Action failed. Please try again.');
			return false;
		} finally {
			setActionState(null);
		}
	}, [fetchOrders]);

	const handleAccept = useCallback((orderId) => performOrderAction(
		() => orderService.acceptOrder(orderId),
		ACTION_TYPES.accept,
		orderId,
		{ nextStatus: 'accepted' }
	), [performOrderAction]);

	const handleReject = useCallback((orderId) => performOrderAction(
		() => orderService.rejectOrder(orderId),
		ACTION_TYPES.reject,
		orderId
	), [performOrderAction]);

	const handleStartPreparing = useCallback((orderId) => performOrderAction(
		() => orderService.updateOrderStatus(orderId, 'preparing'),
		ACTION_TYPES.prepare,
		orderId,
		{ nextStatus: 'preparing' }
	), [performOrderAction]);

	const handleMarkReady = useCallback((orderId) => performOrderAction(
		() => orderService.markOrderReady(orderId),
		ACTION_TYPES.ready,
		orderId,
		{ nextStatus: 'ready_for_pickup' }
	), [performOrderAction]);

	const handleDriverSelection = useCallback(async (driverId) => {
		if (!driverModal.orderId) return;
		const success = await performOrderAction(
			() => orderService.assignDriver(driverModal.orderId, driverId),
			ACTION_TYPES.assign,
			driverModal.orderId
		);
		if (success) {
			setDriverModal({ open: false, orderId: null });
		}
	}, [driverModal.orderId, performOrderAction]);

	const handleTabChange = useCallback((nextStatus) => {
		if (nextStatus === statusFilter) return;
		setStatusFilter(nextStatus);
		statusRef.current = nextStatus;
		setCurrentPage(1);
		pageRef.current = 1;
		fetchOrders({ page: 1, status: nextStatus });
	}, [statusFilter, fetchOrders]);

	const handlePageChange = useCallback((direction) => {
		if (direction === 'prev' && currentPage === 1) return;
		if (direction === 'next' && currentPage >= pagination.totalPages) return;

		const nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
		setCurrentPage(nextPage);
		pageRef.current = nextPage;
		fetchOrders({ page: nextPage });
	}, [currentPage, pagination.totalPages, fetchOrders]);

	const handleRefresh = useCallback(() => fetchOrders(), [fetchOrders]);
	const openDriverModal = useCallback((orderId) => setDriverModal({ open: true, orderId }), []);
	const closeDriverModal = useCallback(() => setDriverModal({ open: false, orderId: null }), []);

	const statusCounts = useMemo(() => (
		orders.reduce((acc, order) => {
			const key = order.status || 'unknown';
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {})
	), [orders]);

	const visibleOrders = useMemo(
		() => (statusFilter === 'all'
			? orders
			: orders.filter(order => order.status === statusFilter)),
		[orders, statusFilter]
	);

	const selectedOrderForModal = useMemo(
		() => orders.find(order => order.id === driverModal.orderId) || null,
		[orders, driverModal.orderId]
	);

	return (
		<div className="orders-page">
			<div className="orders-header">
				<div>
					<h1>Grocery Order Management</h1>
					<p>
						{pagination.total} total orders · {statusCounts.pending || 0} awaiting action
					</p>
				</div>
				<button className="orders-refresh" onClick={handleRefresh} disabled={loading}>
					Refresh
				</button>
			</div>

			<div className="orders-tabs">
				{orderTabs.map(tab => (
					<button
						key={tab.key}
						className={`orders-tab ${statusFilter === tab.key ? 'active' : ''}`}
						onClick={() => handleTabChange(tab.key)}
					>
						<span>{tab.label}</span>
						<span className="tab-count">
							{tab.key === 'all' ? pagination.total : (statusCounts[tab.key] || 0)}
						</span>
					</button>
				))}
			</div>

			{error && <div className="orders-error">{error}</div>}

			{loading ? (
				<div className="orders-loader">
					<Loader message="Loading orders..." />
				</div>
			) : visibleOrders.length === 0 ? (
				<div className="orders-empty">No orders found for this filter.</div>
			) : (
				<div className="orders-grid">
					{visibleOrders.map(order => (
						<OrderCard
							key={order.id}
							order={order}
							statusMeta={statusMeta}
							actionState={actionState}
							onAccept={handleAccept}
							onReject={handleReject}
							onStartPreparing={handleStartPreparing}
							onAssignDriver={openDriverModal}
							onMarkReady={handleMarkReady}
						/>
					))}
				</div>
			)}

			<div className="orders-pagination">
				<button onClick={() => handlePageChange('prev')} disabled={currentPage === 1 || loading}>
					Previous
				</button>
				<span>Page {currentPage} of {Math.max(pagination.totalPages, 1)}</span>
				<button onClick={() => handlePageChange('next')} disabled={currentPage >= pagination.totalPages || loading}>
					Next
				</button>
			</div>

			<Suspense fallback={(
				<div className="orders-loader">
					<Loader message="Loading driver tools..." />
				</div>
			)}>
				<AssignDriverModal
					open={driverModal.open}
					order={selectedOrderForModal}
					drivers={drivers}
					loading={driversLoading}
					error={driversError}
					onClose={closeDriverModal}
					onAssign={handleDriverSelection}
					onRefresh={fetchDrivers}
					actionState={actionState}
				/>
			</Suspense>
		</div>
	);
}
