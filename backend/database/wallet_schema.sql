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
CREATE UNIQUE INDEX idx_unique_order_earning ON public.seller_wallet_transactions (order_id, type) WHERE type = 'order_earning';

-- Row Level Security
ALTER TABLE public.seller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create RPC function to safely process order delivery wallet update
CREATE OR REPLACE FUNCTION process_delivered_order_wallet(p_order_id UUID, p_shop_id UUID, p_amount NUMERIC)
RETURNS boolean AS $$
DECLARE
    v_wallet_id UUID;
    v_existing_tx UUID;
BEGIN
    -- Check if transaction already exists
    SELECT id INTO v_existing_tx 
    FROM public.seller_wallet_transactions 
    WHERE order_id = p_order_id AND type = 'order_earning';

    IF v_existing_tx IS NOT NULL THEN
        RETURN false; -- Transaction already processed
    END IF;

    -- Upsert the wallet to ensure it exists and we lock it for update
    INSERT INTO public.seller_wallets (shop_id, balance, total_earnings)
    VALUES (p_shop_id, p_amount, p_amount)
    ON CONFLICT (shop_id) DO UPDATE 
    SET 
        balance = public.seller_wallets.balance + p_amount,
        total_earnings = public.seller_wallets.total_earnings + p_amount,
        updated_at = NOW()
    RETURNING id INTO v_wallet_id;

    -- Insert the transaction
    INSERT INTO public.seller_wallet_transactions (wallet_id, shop_id, order_id, amount, type, description)
    VALUES (v_wallet_id, p_shop_id, p_order_id, p_amount, 'order_earning', 'Earnings for order delivery');

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
