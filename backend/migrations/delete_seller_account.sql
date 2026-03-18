-- Migration: Create atomic account deletion function
-- This version also removes the user record from the 'users' table.

CREATE OR REPLACE FUNCTION delete_seller_account(p_seller_id UUID)
RETURNS VOID AS $$
DECLARE
    v_shop_id UUID;
BEGIN
    -- 1. Identify the shop_id
    SELECT id INTO v_shop_id FROM shops WHERE seller_id = p_seller_id;

    -- 2. Delete data in order of dependency (child to parent)
    -- This ensures we don't leave orphans and respect foreign keys.

    IF v_shop_id IS NOT NULL THEN
        -- Item related
        DELETE FROM inventory_logs WHERE shop_id = v_shop_id;
        
        -- Order related
        DELETE FROM order_delivery_assignments WHERE order_id IN (SELECT id FROM orders WHERE shop_id = v_shop_id);
        DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE shop_id = v_shop_id);
        DELETE FROM orders WHERE shop_id = v_shop_id;

        -- Item and Category related
        DELETE FROM items WHERE shop_id = v_shop_id;
        DELETE FROM subcategories WHERE shop_id = v_shop_id;
        DELETE FROM categories WHERE shop_id = v_shop_id;

        -- Wallet related
        DELETE FROM seller_wallet_transactions WHERE shop_id = v_shop_id;
        DELETE FROM seller_wallets WHERE shop_id = v_shop_id;

        -- Analytics and Notifications
        DELETE FROM notifications WHERE shop_id = v_shop_id;
        
        -- Finally delete the shop record
        DELETE FROM shops WHERE id = v_shop_id;
    END IF;

    -- 3. Delete the seller from the users table
    DELETE FROM users WHERE id = p_seller_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Account deletion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
