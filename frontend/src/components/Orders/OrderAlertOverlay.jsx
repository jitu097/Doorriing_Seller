import React, { useState, useEffect, useMemo, useRef } from 'react';
import './OrderAlertOverlay.css';
import {
    deriveAcceptanceDeadlineMs,
    deriveInitialRemainingMs,
    formatCountdown,
    resolveTimerVariant,
    clampRemainingMs
} from '../../utils/orderAcceptanceTimer';

const OrderAlertOverlay = ({ orders, onAccept, onDecline, onExpire, loading }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);

    // If orders shrink and currentIndex is out of bounds, fix it
    useEffect(() => {
        if (orders && orders.length > 0 && currentIndex >= orders.length) {
            setCurrentIndex(orders.length - 1);
        }
    }, [orders, currentIndex]);

    if (!orders || orders.length === 0) return null;

    const order = orders[currentIndex];
    if (!order) return null;

    const deadlineMs = useMemo(
        () => (order ? deriveAcceptanceDeadlineMs(order) : null),
        [order?.acceptance_deadline, order?.created_at, order?.id]
    );
    const initialRemainingMs = useMemo(
        () => (order ? clampRemainingMs(deriveInitialRemainingMs(order)) : null),
        [order?.id, order?.acceptance_deadline, order?.remaining_time, order?.created_at]
    );
    const [remainingMs, setRemainingMs] = useState(initialRemainingMs);
    const orderStatus = order.status?.toLowerCase?.() || '';
    const timerEligible = orderStatus === 'pending';
    const hasTimerSource = timerEligible && (deadlineMs !== null || (typeof initialRemainingMs === 'number' && initialRemainingMs > 0));
    const timerActive = hasTimerSource && typeof remainingMs === 'number' && remainingMs > 0;
    const isExpired = timerEligible && typeof remainingMs === 'number' && remainingMs <= 0;
    const timerVariant = timerActive ? resolveTimerVariant(remainingMs) : 'neutral';
    const safeRemainingMs = clampRemainingMs(remainingMs) ?? 0;
    const countdownDisplay = hasTimerSource ? formatCountdown(safeRemainingMs) : null;
    const expireNotifiedRef = useRef(null);

    useEffect(() => {
        setRemainingMs(initialRemainingMs);
        expireNotifiedRef.current = null;
    }, [initialRemainingMs, order?.id]);

    useEffect(() => {
        if (!timerEligible || !hasTimerSource) return undefined;

        const intervalId = setInterval(() => {
            setRemainingMs(prev => {
                if (deadlineMs !== null) {
                    const diff = deadlineMs - Date.now();
                    return diff > 0 ? diff : 0;
                }

                const fallback = typeof prev === 'number' ? prev : (initialRemainingMs ?? 0);
                const next = fallback - 1000;
                return next > 0 ? next : 0;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timerEligible, hasTimerSource, deadlineMs, initialRemainingMs]);

    useEffect(() => {
        if (!timerEligible) return;
        if (typeof remainingMs !== 'number') return;
        if (remainingMs > 0) return;
        if (expireNotifiedRef.current === order.id) return;
        expireNotifiedRef.current = order.id;
        if (typeof onExpire === 'function') {
            onExpire(order.id);
        }
    }, [timerEligible, remainingMs, onExpire, order]);

    const timerStatusText = isExpired ? 'Time Over ⏳' : 'Time left ⏳';

    const items = order.items || [];
    const totalAmount = order.total_amount || 0;
    const hasMultiple = orders.length > 1;

    const handlePrevious = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentIndex < orders.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;

        // Threshold for swipe (e.g. 50px)
        if (diff > 50) {
            // Swipe right = Previous
            handlePrevious();
        } else if (diff < -50) {
            // Swipe left = Next
            handleNext();
        }
        setTouchStartX(null);
    };

    return (
        <div className="order-alert-overlay">
            <div
                className="order-alert-modal"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="order-alert-header">
                    <div className="pulse-dot"></div>
                    <h2>New Incoming Order!</h2>
                    <span className="order-id">#{order.id.split('-')[0].toUpperCase()}</span>
                </div>

                {hasMultiple && (
                    <div className="order-slider-controls">
                        <button
                            className="slider-btn"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0 || loading}
                        >
                            &#10094;
                        </button>
                        <span className="slider-counter">
                            Order {currentIndex + 1} of {orders.length}
                        </span>
                        <button
                            className="slider-btn"
                            onClick={handleNext}
                            disabled={currentIndex === orders.length - 1 || loading}
                        >
                            &#10095;
                        </button>
                    </div>
                )}

                {hasTimerSource && (
                    <div className={`order-alert-timer order-alert-timer--${timerVariant}`}>
                        <div>
                            <p className="order-alert-timer__label">Acceptance window</p>
                            <span className="order-alert-timer__status">{timerStatusText}</span>
                        </div>
                        {countdownDisplay && (
                            <span className={`order-alert-timer__value ${timerVariant === 'danger' ? 'pulse' : ''}`}>
                                {countdownDisplay}
                            </span>
                        )}
                    </div>
                )}

                <div className="order-alert-content">
                    <div className="order-alert-customer">
                        <p><strong>Customer:</strong> {order.customer_name || 'Customer'}</p>
                        {order.delivery_address && (
                            <p className="address-text"><strong>Drop:</strong> {order.delivery_address}</p>
                        )}
                    </div>

                    <div className="order-alert-items">
                        <h3>Order Items</h3>
                        <ul>
                            {items.map((item, idx) => (
                                <li key={idx}>
                                    <span className="item-qty">{item.quantity}x</span>
                                    <span className="item-name">{item.name || item.item_name}</span>
                                    {item.price && <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="order-alert-footer">
                    <div className="order-total-display">
                        <span>Total Pay:</span>
                        <h2>₹{Number(totalAmount).toFixed(2)}</h2>
                    </div>

                    <div className="order-alert-actions">
                        <button
                            className="btn-decline"
                            onClick={() => onDecline(order.id)}
                            disabled={loading || isExpired}
                        >
                            Decline Order
                        </button>
                        <button
                            className="btn-accept"
                            onClick={() => onAccept(order.id)}
                            disabled={loading || isExpired}
                        >
                            {loading ? 'Processing...' : 'Accept Order'}
                        </button>
                    </div>
                    {isExpired && (
                        <p className="order-alert-expired-note">Not accepted in time. Order expired.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderAlertOverlay;
