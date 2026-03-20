import { useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { shopService } from '../services/shopService';

export const useOrderInsertRealtime = (onInsert, providedShopId = null) => {
    const [shopId, setShopId] = useState(providedShopId);
    const callbackRef = useRef(onInsert);

    useEffect(() => {
        callbackRef.current = onInsert;
    }, [onInsert]);

    useEffect(() => {
        if (providedShopId && providedShopId !== shopId) {
            setShopId(providedShopId);
        }
    }, [providedShopId, shopId]);

    useEffect(() => {
        if (shopId || providedShopId === '') return;

        let isCancelled = false;

        const fetchShopId = async () => {
            try {
                const shop = await shopService.getCurrentShop();
                if (!isCancelled && shop?.id) {
                    setShopId(shop.id);
                }
            } catch (error) {
                console.error('Failed to resolve shop id for order realtime subscription', error);
            }
        };

        fetchShopId();

        return () => {
            isCancelled = true;
        };
    }, [shopId, providedShopId]);

    const processedOrderIdsRef = useRef(new Set());

    useEffect(() => {
        if (!shopId) return undefined;

        console.log(`[Realtime] Subscribing to orders for shop: ${shopId}`);
        const channel = supabase
            .channel(`orders:insert:shop:${shopId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `shop_id=eq.${shopId}`
                },
                (payload) => {
                    console.log('[Realtime] New order received:', payload.new?.id);
                    if (!payload?.new || String(payload.new.shop_id) !== String(shopId)) {
                        console.warn('[Realtime] Received order for different shop or invalid payload', { 
                            expectedShopId: shopId, 
                            receivedShopId: payload.new?.shop_id 
                        });
                        return;
                    }

                    const orderId = payload.new.id;
                    if (processedOrderIdsRef.current.has(orderId)) {
                        return;
                    }

                    // Add to processed set and set a timeout to cleanup (prevent infinite growth)
                    processedOrderIdsRef.current.add(orderId);
                    setTimeout(() => {
                        processedOrderIdsRef.current.delete(orderId);
                    }, 60000); // 1 minute window

                    if (callbackRef.current) {
                        callbackRef.current(payload);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shopId]);

    return shopId;
};

export default useOrderInsertRealtime;
