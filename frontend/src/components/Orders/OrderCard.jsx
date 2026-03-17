import React, { memo, useEffect, useMemo, useState } from 'react';
import './OrderCard.css';
import {
  deriveAcceptanceDeadlineMs,
  deriveInitialRemainingMs,
  clampRemainingMs,
  formatCountdown,
  resolveTimerVariant,
  isPendingOrderExpired
} from '../../utils/orderAcceptanceTimer';

const formatCurrency = (value) => {
  const amount = Number(value);
  const safeValue = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(safeValue);
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString();
};

const statusClassName = (statusMeta, status) => {
  const config = statusMeta[status];
  const color = config?.color || '#475569';
  return {
    label: config?.label || status.replace(/_/g, ' '),
    style: { backgroundColor: `${color}1a`, color }
  };
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveItemPrice = (item = {}) => {
  const quantity = Number(item.quantity) || 1;
  const lineCandidates = [
    toNumber(item.total_price),
    toNumber(item.subtotal),
    toNumber(item.amount),
    toNumber(item.line_total),
    toNumber(item.price_total)
  ];

  const unitCandidates = [
    toNumber(item.price),
    toNumber(item.unit_price),
    toNumber(item.rate),
    toNumber(item.base_price)
  ];

  for (const value of lineCandidates) {
    if (value !== null) return value;
  }

  for (const value of unitCandidates) {
    if (value !== null) return value * quantity;
  }

  if (item.price_details && typeof item.price_details === 'object') {
    const details = item.price_details;
    const detailLine = toNumber(details.total ?? details.amount);
    if (detailLine !== null) return detailLine;
    const detailUnit = toNumber(details.unit ?? details.price);
    if (detailUnit !== null) return detailUnit * quantity;
  }

  return null;
};

const OrderCard = ({
  order,
  statusMeta,
  actionState,
  onAccept,
  onReject,
  onStartPreparing,
  onAssignDriver,
  onMarkReady
}) => {
  const initialRemainingMs = useMemo(
    () => clampRemainingMs(deriveInitialRemainingMs(order)),
    [order]
  );
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);

  useEffect(() => {
    setRemainingMs(initialRemainingMs);
  }, [initialRemainingMs]);

  const items = useMemo(() => (Array.isArray(order.items) ? order.items : []), [order.items]);
  const { label, style } = useMemo(
    () => statusClassName(statusMeta, order.status || 'pending'),
    [statusMeta, order.status]
  );
  const isActionLoading = actionState?.orderId === order.id;
  const baseDisabled = Boolean(isActionLoading);
  const orderTotalDisplay = useMemo(() => formatCurrency(order.total_amount), [order.total_amount]);
  const orderedAtDisplay = useMemo(() => formatDateTime(order.created_at), [order.created_at]);
  const preparedItems = useMemo(
    () => items.map((item, index) => ({
      key: `${order.id}-item-${index}`,
      name: item.name,
      quantity: item.quantity,
      priceAmount: resolveItemPrice(item)
    })),
    [items, order.id]
  );
  const isPending = order.status === 'pending' || order.order_status === 'pending';
  const derivedExpired = order.status === 'expired' || order.order_status === 'expired' || isPendingOrderExpired(order, remainingMs);
  const timerActive = isPending && !derivedExpired && typeof remainingMs === 'number' && remainingMs > 0;
  const hasTimerSource = isPending && ((typeof initialRemainingMs === 'number' && initialRemainingMs > 0) || (typeof order.remainingMs === 'number'));
  const shouldRunTimer = isPending && !derivedExpired && hasTimerSource;

  useEffect(() => {
    if (!shouldRunTimer) return undefined;

    const intervalId = setInterval(() => {
      setRemainingMs(prev => {
        const current = typeof prev === 'number' ? prev : (initialRemainingMs ?? 0);
        const next = current - 1000;
        return next > 0 ? next : 0;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [shouldRunTimer, initialRemainingMs]);

  const timerVariant = timerActive ? resolveTimerVariant(remainingMs) : 'neutral';
  const countdownDisplay = timerActive ? formatCountdown(remainingMs) : null;
  const staticTimerMessage = useMemo(() => {
    if (derivedExpired && order.status === 'expired') return 'Not Accepted (Time Over)';
    if (derivedExpired) return 'Time Over ⏳';
    if (order.status === 'accepted') return 'Accepted ✅';
    if (order.status === 'rejected') return 'Rejected ❌';
    return null;
  }, [derivedExpired, order.status]);
  const timerStatusText = timerActive ? 'Time left ⏳' : staticTimerMessage;
  const shouldShowTimerSection = Boolean(timerActive || timerStatusText);
  const timerClassName = `seller-order-card__timer seller-order-card__timer--${timerVariant}`;
  const canRespond = isPending && !derivedExpired;
  const showDriverInfo = Boolean(order.driver && order.status !== 'delivered');

  return (
    <article className="seller-order-card">
      <header className="seller-order-card__header">
        <div>
          <p className="seller-order-card__label">Order</p>
          <h3>#{order.order_number || order.id}</h3>
        </div>
        <span className="seller-order-card__status" style={style}>{label}</span>
      </header>

      <section className="seller-order-card__summary">
        <p className="seller-order-card__label">Order Total</p>
        <strong>{orderTotalDisplay}</strong>
      </section>

      <section className="seller-order-card__items">
        <p className="seller-order-card__label">Items</p>
        <ul>
          {preparedItems.length ? (
            preparedItems.map(item => (
              <li key={item.key}>
                <span>{item.name}</span>
                <span className="qty">×{item.quantity}</span>
                <span className="price">{item.priceAmount !== null ? formatCurrency(item.priceAmount) : '--'}</span>
              </li>
            ))
          ) : (
            <li className="muted">No items available</li>
          )}
        </ul>
      </section>

      {/* Only show timer for pending orders with accept/reject actions */}
      {order.status === 'pending' && shouldShowTimerSection && (
        <section className={timerClassName}>
          <div>
            <p className="seller-order-card__label">Acceptance window</p>
            {timerStatusText && (
              <span className="seller-order-card__timer-text">
                {timerStatusText}
                {timerActive ? ':' : ''}
              </span>
            )}
          </div>
          {timerActive && (
            <span className={`seller-order-card__timer-value ${timerVariant === 'danger' ? 'pulse' : ''}`}>
              {countdownDisplay}
            </span>
          )}
        </section>
      )}

      {showDriverInfo && (
        <section className="seller-order-card__driver">
          <div>
            <p className="seller-order-card__label">Delivery Partner</p>
            <strong>{order.driver.name}</strong>
          </div>
          <a href={`tel:${order.driver.phone}`} className="seller-order-card__driver-call">
            Call
          </a>
        </section>
      )}

      <section className="seller-order-card__actions">
        {order.status === 'pending' && (
          <>
            <button className="solid success" disabled={baseDisabled || !canRespond} onClick={() => onAccept(order.id)}>
              {isActionLoading && actionState?.type === 'accept' ? 'Accepting…' : 'Accept Order'}
            </button>
            <button className="solid danger" disabled={baseDisabled || !canRespond} onClick={() => onReject(order.id)}>
              {isActionLoading && actionState?.type === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </>
        )}
        {order.status === 'accepted' && (
          <button className="solid primary" disabled={baseDisabled} onClick={() => onStartPreparing(order.id)}>
            {isActionLoading && actionState?.type === 'prepare' ? 'Starting…' : 'Start Preparing'}
          </button>
        )}
        {order.status === 'preparing' && (
          <>
            <button 
              className="outline" 
              disabled={baseDisabled} 
              onClick={() => onAssignDriver(order.id)}
            >
              {order.delivery_partner_id || order.delivery_partner_name ? 'Reassign Driver' : 'Assign Driver'}
            </button>
            <button 
              className="solid success" 
              disabled={baseDisabled} 
              onClick={() => {
                if (!order.delivery_partner_id && !order.delivery_partner_name) {
                  alert('Please assign a driver first before marking the order as ready.');
                  return;
                }
                onMarkReady(order.id);
              }}
            >
              {isActionLoading && actionState?.type === 'ready' ? 'Updating…' : 'Mark Ready'}
            </button>
          </>
        )}
      </section>

      <footer className="seller-order-card__footer">
        Ordered at {orderedAtDisplay}
      </footer>
    </article>
  );
};

const arePropsEqual = (prev, next) => {
  if (prev.order.id !== next.order.id) return false;
  if (prev.order.status !== next.order.status) return false;
  if ((prev.order.acceptance_deadline || null) !== (next.order.acceptance_deadline || null)) return false;
  if ((prev.order.remaining_time ?? null) !== (next.order.remaining_time ?? null)) return false;
  if ((prev.order.driver?.id || null) !== (next.order.driver?.id || null)) return false;
  if (prev.actionState?.orderId !== next.actionState?.orderId) return false;
  if (prev.actionState?.type !== next.actionState?.type) return false;
  return prev.order.total_amount === next.order.total_amount;
};

export default memo(OrderCard, arePropsEqual);
