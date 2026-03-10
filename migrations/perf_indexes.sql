-- =============================================================================
-- BazarSe Seller — Performance Index Migration
-- Created: 2026-03-11
-- 
-- Purpose: Add indexes to the most frequently queried columns across the
--          BazarSe Seller platform to speed up dashboard, orders, wallet,
--          and notification queries.
--
-- All statements use CREATE INDEX IF NOT EXISTS — safe to re-run.
-- Run this in Supabase: Dashboard > SQL Editor > Paste and Run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders table
-- Most queried table in the application: filtered by shop_id and status on
-- every dashboard, orders page, and analytics query.
-- -----------------------------------------------------------------------------

-- Primary filter: every query starts with WHERE shop_id = ?
CREATE INDEX IF NOT EXISTS idx_orders_shop_id
    ON orders(shop_id);

-- Secondary filter: status tabs on Orders page
CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);

-- Sorting: all order lists are ordered by created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders(created_at DESC);

-- Composite: covers both dashboard analytics (shop_id + created_at) pattern
CREATE INDEX IF NOT EXISTS idx_orders_shop_created
    ON orders(shop_id, created_at DESC);

-- Composite: covers orders page tab filters (shop_id + status)
CREATE INDEX IF NOT EXISTS idx_orders_shop_status
    ON orders(shop_id, status);

-- -----------------------------------------------------------------------------
-- items table (grocery products / restaurant menu items)
-- Queried on every Products/Menu page load for the authenticated shop.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_items_shop_id
    ON items(shop_id);

-- -----------------------------------------------------------------------------
-- seller_wallet_transactions table
-- Queried by Wallet page for earnings history, filtered by shop_id.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_wallet_txn_shop_id
    ON seller_wallet_transactions(shop_id);

CREATE INDEX IF NOT EXISTS idx_wallet_txn_shop_created
    ON seller_wallet_transactions(shop_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- notifications table
-- Queried in real-time and on notification badge updates.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_notifications_shop_id
    ON notifications(shop_id);

CREATE INDEX IF NOT EXISTS idx_notifications_shop_read
    ON notifications(shop_id, is_read);

-- -----------------------------------------------------------------------------
-- bookings table (restaurant only)
-- Queried by booking date on the Restaurant Dashboard.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_bookings_shop_id
    ON bookings(shop_id);

CREATE INDEX IF NOT EXISTS idx_bookings_shop_date
    ON bookings(shop_id, booking_date);
