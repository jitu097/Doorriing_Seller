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

    useEffect(() => {
        if (!shopId) return undefined;

        if (import.meta.env.DEV) {
            console.log('[Realtime][orders] creating INSERT subscription', {
                shopId,
                filter: `shop_id=eq.${shopId}`
            });
        }

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
                    if (import.meta.env.DEV) {
                        console.log('[Realtime][orders] INSERT payload received', payload);
                        console.log('[Realtime][orders] current shop id', shopId);
                    }

                    if (!payload?.new || String(payload.new.shop_id) !== String(shopId)) {
                        return;
                    }

                    if (callbackRef.current) {
                        callbackRef.current(payload);
                    }
                }
            )
            .subscribe((status) => {
                if (import.meta.env.DEV) {
                    console.log(`[Realtime][orders] channel status: ${status}`, { shopId });
                }
            });

        return () => {
            if (import.meta.env.DEV) {
                console.log('[Realtime][orders] removing channel', { shopId });
            }
            supabase.removeChannel(channel);
        };
    }, [shopId]);

    return shopId;
};

export default useOrderInsertRealtime;
