import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import orderService from '../../services/orderService';
import OrderAlertOverlay from './OrderAlertOverlay';

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
                const existingPending = response.data?.orders || response.orders || [];

                // Sort oldest first (backend defaults to descending `created_at`)
                const chronologicalOrders = [...existingPending].reverse();

                if (chronologicalOrders.length > 0) {
                    setOrderQueue(prevQueue => {
                        const newQueue = [...prevQueue];
                        chronologicalOrders.forEach(order => {
                            if (!newQueue.some(o => o.id === order.id)) {
                                newQueue.push(order);
                            }
                        });
                        return newQueue;
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

                if (orderData && orderData.status?.toLowerCase() === 'pending') {
                    setOrderQueue(prevQueue => {
                        // Prevent duplicate alerts for the exact same order id
                        if (prevQueue.some(o => o.id === orderData.id)) return prevQueue;
                        return [...prevQueue, orderData];
                    });
                }
            } catch (error) {
                console.error('Failed to fetch complete order details for realtime alert', error);
            }
        }
    });

    const activeOrder = orderQueue[0];

    const popQueue = () => {
        setOrderQueue(prev => prev.slice(1));
    };

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
            loading={loadingAction}
        />
    );
};

export default OrderAlertManager;
