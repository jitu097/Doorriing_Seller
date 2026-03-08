-- 1. Create seller_wallets table
CREATE TABLE IF NOT EXISTS public.seller_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE,
    balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create seller_wallet_transactions table
CREATE TABLE IF NOT EXISTS public.seller_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.seller_wallets(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique index to prevent duplicate 'order_earning' for the same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_order_earning ON public.seller_wallet_transactions (order_id, type) WHERE type = 'order_earning';

-- Row Level Security
ALTER TABLE public.seller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RPC function to safely process order delivery wallet update
CREATE OR REPLACE FUNCTION process_delivered_order_wallet(p_order_id UUID, p_shop_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM seller_wallet_transactions
        WHERE order_id = p_order_id AND type = 'order_earning'
    ) INTO v_transaction_exists;

    IF v_transaction_exists THEN
        RETURN FALSE;
    END IF;

    SELECT id INTO v_wallet_id
    FROM seller_wallets
    WHERE shop_id = p_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO seller_wallets (shop_id, balance, total_earnings)
        VALUES (p_shop_id, p_amount, p_amount)
        RETURNING id INTO v_wallet_id;
    ELSE
        UPDATE seller_wallets
        SET 
            balance = balance + p_amount,
            total_earnings = total_earnings + p_amount,
            updated_at = NOW()
        WHERE id = v_wallet_id;
    END IF;

    INSERT INTO seller_wallet_transactions (
        wallet_id, shop_id, order_id, amount, type, description
    ) VALUES (
        v_wallet_id, p_shop_id, p_order_id, p_amount, 'order_earning', 'Earnings for order delivery'
    );

    RETURN TRUE;
END;
$$;
