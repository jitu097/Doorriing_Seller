-- Ensure a clean slate for these tables if they were misconfigured before
DROP TABLE IF EXISTS public.seller_withdraw_requests CASCADE;
DROP TABLE IF EXISTS public.seller_payout_accounts CASCADE;

-- 1. Create seller_payout_accounts table
CREATE TABLE public.seller_payout_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('upi', 'bank')),
    
    -- UPI Fields
    upi_id VARCHAR(255),
    
    -- Bank Transfer Fields
    account_number VARCHAR(100),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(255),
    account_holder_name VARCHAR(255),
    
    -- Common Contact Fields
    contact_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one default account per shop
CREATE UNIQUE INDEX idx_unique_default_payout ON public.seller_payout_accounts (shop_id) WHERE is_default = true;

-- 2. Create seller_withdraw_requests table
CREATE TABLE IF NOT EXISTS public.seller_withdraw_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.seller_wallets(id) ON DELETE CASCADE,
    payout_account_id UUID REFERENCES public.seller_payout_accounts(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.seller_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_withdraw_requests ENABLE ROW LEVEL SECURITY;

-- No specific policies needed as the backend accesses these tables
-- using the Supabase Service Role key which bypasses RLS.
