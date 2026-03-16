import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import orderService from '../../services/orderService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import Loader from '../../components/common/Loader';
import OrderCard from '../../components/Orders/OrderCard';
import AssignDriverModal from '../../components/Orders/AssignDriverModal';
import './Orders.css';

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
      const list = Array.isArray(response?.orders) ? response.orders : [];
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
      console.error(err);
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
      console.error(err);
      setDrivers([]);
      setDriversError(err?.message || 'Unable to load drivers');
    } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => {
    if (driverModal.open) {
      fetchDrivers();
    }
  }, [driverModal.open, fetchDrivers]);

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
        console.error(err);
        setError(err?.message || 'Action failed. Please try again.');
        return false;
      } finally {
        setActionState(null);
      }
    }, [fetchOrders]);

  const handleAccept = (orderId) => performOrderAction(
    () => orderService.acceptOrder(orderId),
    ACTION_TYPES.accept,
    orderId,
    { nextStatus: 'accepted' }
  );

  const handleReject = (orderId) => performOrderAction(
    () => orderService.rejectOrder(orderId),
    ACTION_TYPES.reject,
    orderId
  );

  const handleStartPreparing = (orderId) => performOrderAction(
    () => orderService.updateOrderStatus(orderId, 'preparing'),
    ACTION_TYPES.prepare,
    orderId,
    { nextStatus: 'preparing' }
  );

  const handleMarkReady = (orderId) => performOrderAction(
    () => orderService.markOrderReady(orderId),
    ACTION_TYPES.ready,
    orderId,
    { nextStatus: 'ready_for_pickup' }
  );
  const handleDriverSelection = async (driverId) => {
    if (!driverModal.orderId) return;
    const success = await performOrderAction(
      () => orderService.assignDriver(driverModal.orderId, driverId),
      ACTION_TYPES.assign,
      driverModal.orderId
    );
    if (success) {
      setDriverModal({ open: false, orderId: null });
    }
  };

  const handleTabChange = (nextStatus) => {
    if (nextStatus === statusFilter) return;
    setStatusFilter(nextStatus);
    statusRef.current = nextStatus;
    setCurrentPage(1);
    pageRef.current = 1;
    fetchOrders({ page: 1, status: nextStatus });
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage === 1) return;
    if (direction === 'next' && currentPage >= pagination.totalPages) return;

    const nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    setCurrentPage(nextPage);
    pageRef.current = nextPage;
    fetchOrders({ page: nextPage });
  };

  const handleRefresh = () => fetchOrders();
  const openDriverModal = (orderId) => setDriverModal({ open: true, orderId });
  const closeDriverModal = () => setDriverModal({ open: false, orderId: null });

  const statusCounts = useMemo(() => (
    orders.reduce((acc, order) => {
      const key = order.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ), [orders]);

  const visibleOrders = useMemo(() => (
    statusFilter === 'all'
      ? orders
      : orders.filter(order => order.status === statusFilter)
  ), [statusFilter, orders]);

  const selectedOrderForModal = useMemo(
    () => orders.find(order => order.id === driverModal.orderId) || null,
    [orders, driverModal.orderId]
  );

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>Seller Order Management</h1>
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
    </div>
  );
}
