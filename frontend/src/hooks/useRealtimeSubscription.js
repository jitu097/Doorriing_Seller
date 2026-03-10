import { useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { shopService } from '../services/shopService';

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

/**
 * Hook to subscribe to real-time changes on a specific Supabase table
 * @param {string} tableName - The name of the table to listen to
 * @param {function} onRowChange - The callback to execute when a change occurs
 * @param {string|number} [providedShopId] - Optional. If omitted, it will fetch the current shop ID automatically
 * @param {number} debounceMs - Milliseconds to debounce the callback (default 500ms)
 */
export const useRealtimeSubscription = (tableName, onRowChange, providedShopId = null, debounceMs = 500) => {
    const [shopId, setShopId] = useState(providedShopId);
    const callbackRef = useRef(onRowChange);

    useEffect(() => {
        callbackRef.current = onRowChange;
    }, [onRowChange]);

    useEffect(() => {
        if (shopId) return;
        const fetchShop = async () => {
            try {
                const shop = await shopService.getCurrentShop();
                if (shop?.id) {
                    setShopId(shop.id);
                }
            } catch (e) {
                console.error('Failed to fetch shop for realtime subscription', e);
            }
        };
        fetchShop();
    }, [shopId]);

    useEffect(() => {
        if (!tableName || !shopId) return;

        const debouncedCallback = debounce((payload) => {
            console.log(`Realtime update received on table: ${tableName} for shop ${shopId}`);
            if (callbackRef.current) {
                callbackRef.current(payload);
            }
        }, debounceMs);

        const channelName = `public:${tableName}:shop_id=eq.${shopId}`;

        const channel = supabase.channel(channelName)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: tableName, filter: `shop_id=eq.${shopId}` },
                debouncedCallback
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: tableName, filter: `shop_id=eq.${shopId}` },
                debouncedCallback
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: tableName, filter: `shop_id=eq.${shopId}` },
                debouncedCallback
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to realtime channel: ${channelName}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, shopId, debounceMs]);
};
