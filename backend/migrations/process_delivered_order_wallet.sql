-- Supabase RPC Function to process wallet earning securely inside a transaction
-- This ensures no duplicate credits and locks the wallet row to prevent race conditions.

CREATE OR REPLACE FUNCTION process_delivered_order_wallet(p_order_id UUID, p_shop_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_exists BOOLEAN;
BEGIN
    -- 1. Check if a transaction for this order already exists
    SELECT EXISTS (
        SELECT 1 FROM seller_wallet_transactions
        WHERE order_id = p_order_id AND type = 'order_earning'
    ) INTO v_transaction_exists;

    -- If it exists, abort quietly (duplicate safety)
    IF v_transaction_exists THEN
        RETURN FALSE;
    END IF;

    -- 2. Get the wallet ID for the shop
    SELECT id INTO v_wallet_id
    FROM seller_wallets
    WHERE shop_id = p_shop_id
    FOR UPDATE; -- Lock the row to prevent concurrent updates

    -- If no wallet exists, create it (should be handled by other flows, but just in case)
    IF NOT FOUND THEN
        INSERT INTO seller_wallets (shop_id, balance, total_earnings)
        VALUES (p_shop_id, p_amount, p_amount)
        RETURNING id INTO v_wallet_id;
    ELSE
        -- 3. Update the wallet balance and total earnings
        UPDATE seller_wallets
        SET 
            balance = balance + p_amount,
            total_earnings = total_earnings + p_amount,
            updated_at = NOW()
        WHERE id = v_wallet_id;
    END IF;

    -- 4. Insert the transaction record
    INSERT INTO seller_wallet_transactions (
        wallet_id,
        shop_id,
        order_id,
        amount,
        type,
        description
    ) VALUES (
        v_wallet_id,
        p_shop_id,
        p_order_id,
        p_amount,
        'order_earning',
        'Order delivered earning'
    );

    RETURN TRUE;
END;
$$;
