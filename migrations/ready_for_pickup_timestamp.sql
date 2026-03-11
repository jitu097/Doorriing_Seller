-- Adds and backfills the ready_for_pickup_at timestamp column for orders
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMPTZ;

-- Backfill legacy data so existing "ready" orders get a timestamp
UPDATE orders
SET ready_for_pickup_at = COALESCE(ready_for_pickup_at, updated_at)
WHERE status IN ('ready', 'ready_for_pickup')
  AND ready_for_pickup_at IS NULL;

-- Helpful for filtering dashboards/analytics
CREATE INDEX IF NOT EXISTS idx_orders_ready_for_pickup_at
    ON orders (ready_for_pickup_at)
    WHERE ready_for_pickup_at IS NOT NULL;
