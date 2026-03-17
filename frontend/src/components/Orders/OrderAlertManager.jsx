import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import orderService from '../../services/orderService';
import OrderAlertOverlay from './OrderAlertOverlay';
import { deriveAcceptanceDeadlineMs, deriveInitialRemainingMs } from '../../utils/orderAcceptanceTimer';

/**
 * Global Order Manager wrapper. 
 * Mounts the Realtime Hook exclusively for `status = 'pending'` inserts.
 */
const OrderAlertManager = () => {
    const [orderQueue, setOrderQueue] = useState([]);
    const [loadingAction, setLoadingAction] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Determine the base path based on current location ('/grocery' or '/restaurant')
    const basePath = location.pathname.includes('/grocery') ? '/grocery' : '/restaurant';

    // 1. Fetch any EXISTING pending orders immediately upon component mount 
    // (Handles scenarios where the seller refreshed the page or was offline when the order arrived)
    useEffect(() => {
        const fetchExistingOrders = async () => {
            try {
                const response = await orderService.getOrders({ status: 'pending' });
                const existingPending = (response.orders || response.data?.orders || []).filter(o => 
                    ['pending', 'new'].includes(o.status?.toLowerCase() || o.order_status?.toLowerCase())
                );

                // Sort oldest first (backend defaults to descending `created_at`)
                const chronologicalOrders = [...existingPending].reverse();

                if (chronologicalOrders.length > 0) {
                    const serverTime = response.serverTime || response.data?.serverTime;
                    setOrderQueue(prevQueue => {
                        const existingIds = new Set(prevQueue.map(o => o.id));
                        const toAdd = chronologicalOrders
                            .filter(order => !existingIds.has(order.id))
                            .map(order => ({ 
                                ...order, 
                                serverTime, // Attach server snapshot time
                                remainingMs: deriveInitialRemainingMs(order, serverTime)
                            }));
                        return toAdd.length ? [...prevQueue, ...toAdd] : prevQueue;
                    });
                }
            } catch (error) {
                console.error('Failed to hydrate existing pending orders on mount', error);
            }
        };
        fetchExistingOrders();
    }, []);

    // 2. Subscribe to new incoming orders directly mapped to this seller's shop_id 
    // (shop_id filter is natively handled inside the useRealtimeSubscription hook)
    useRealtimeSubscription('orders', async (payload) => {
        if (payload.eventType === 'INSERT') {
            try {
                // Realtime payloads often lack relational joins (like order_items) 
                // and might have RLS constraints. Fetch the full order explicitly:
                const response = await orderService.getOrderById(payload.new.id);
                const orderData = response.data || response.order || response;

                const status = (orderData.status || orderData.order_status)?.toLowerCase() || '';
                if (orderData && ['pending', 'new'].includes(status)) {
                    const serverTime = response.serverTime || response.data?.serverTime || new Date().toISOString(); 
                    setOrderQueue(prevQueue => {
                        // Prevent duplicate alerts for the exact same order id
                        if (prevQueue.some(o => o.id === orderData.id)) return prevQueue;
                        const initialRemaining = deriveInitialRemainingMs(orderData, serverTime);
                        return [...prevQueue, { 
                            ...orderData, 
                            serverTime,
                            remainingMs: typeof initialRemaining === 'number' ? initialRemaining : null 
                        }];
                    });
                }
            } catch (error) {
                console.error('Failed to fetch complete order details for realtime alert', error);
            }
        }
    });

    useEffect(() => {
        if (!orderQueue.length) return undefined;

        const intervalId = setInterval(() => {
            const expiredIds = [];

            setOrderQueue(prev => {
                if (!prev.length) return prev;

                let mutated = false;
                const updated = prev.map(order => {
                    const status = (order.status || order.order_status)?.toLowerCase?.();
                    if (status !== 'pending' && status !== 'new' && status !== '') return order;
                    
                    const currentMs = typeof order.remainingMs === 'number' ? order.remainingMs : deriveInitialRemainingMs(order, order.serverTime);
                    if (typeof currentMs === 'number') {
                        const nextMs = Math.max(0, currentMs - 1000);
                        if (nextMs !== order.remainingMs) {
                            mutated = true;
                            return { ...order, remainingMs: nextMs };
                        }
                    }
                    return order;
                });

                const filtered = updated.filter(order => {
                    const status = (order.status || order.order_status)?.toLowerCase?.() || '';
                    if (!['pending', 'new'].includes(status)) return true;
                    if (typeof order.remainingMs === 'number' && order.remainingMs <= 0) {
                        expiredIds.push(order.id);
                        mutated = true;
                        return false;
                    }
                    return true;
                });

                return mutated ? filtered : prev;
            });

            if (expiredIds.length) {
                window.dispatchEvent(new CustomEvent('order-alert-action'));
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [orderQueue.length]);

    const activeOrder = orderQueue[0];

    const handleAccept = async (orderId) => {
        try {
            setLoadingAction(true);
            await orderService.acceptOrder(orderId);

            // Remove the specific order from the queue
            setOrderQueue(prev => prev.filter(o => o.id !== orderId));

            // Dispatch custom event to aggressively update mounted Orders tables
            window.dispatchEvent(new CustomEvent('order-alert-action'));

            // Navigate directly to the orders page as requested
            navigate(`${basePath}/orders`);
        } catch (error) {
            console.error('Failed to accept order out of overlay context', error);
            alert('Error accepting order. Please try again.');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleAutoExpire = useCallback((orderId) => {
        if (!orderId) return;
        setOrderQueue(prev => prev.filter(order => order.id !== orderId));
        window.dispatchEvent(new CustomEvent('order-alert-action'));
    }, []);

    const handleDecline = async (orderId) => {
        try {
            setLoadingAction(true);
            await orderService.rejectOrder(orderId);

            // Remove the specific order from the queue
            setOrderQueue(prev => prev.filter(o => o.id !== orderId));

            // Dispatch custom event to aggressively update mounted Orders tables
            window.dispatchEvent(new CustomEvent('order-alert-action'));

            // Navigate directly to the orders page as requested
            navigate(`${basePath}/orders`);
        } catch (error) {
            console.error('Failed to decline order out of overlay context', error);
            alert('Error declining order. Please try again.');
        } finally {
            setLoadingAction(false);
        }
    };

    if (orderQueue.length === 0) return null;

    return (
        <OrderAlertOverlay
            orders={orderQueue}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onExpire={handleAutoExpire}
            loading={loadingAction}
        />
    );
};

export default OrderAlertManager;
