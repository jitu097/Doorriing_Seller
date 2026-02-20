-- Add shop status + timing columns for seller/user sync
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS opening_time TIME,
ADD COLUMN IF NOT EXISTS closing_time TIME;

-- Backfill status from legacy is_open when possible
UPDATE shops
SET status = CASE
    WHEN is_open = false THEN 'closed'
    ELSE 'open'
END
WHERE status IS NULL OR status = '';

-- Keep status constrained to supported values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shops_status_check'
    ) THEN
        ALTER TABLE shops
        ADD CONSTRAINT shops_status_check CHECK (status IN ('open', 'closed'));
    END IF;
END $$;
