-- Function to set acceptance_deadline
CREATE OR REPLACE FUNCTION set_order_acceptance_deadline()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if it's currently NULL to allow manual overrides if needed (though usually it will be NULL)
    IF NEW.acceptance_deadline IS NULL THEN
        NEW.acceptance_deadline := NEW.created_at + INTERVAL '5 minutes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before INSERT
DROP TRIGGER IF EXISTS trigger_set_order_acceptance_deadline ON orders;
CREATE TRIGGER trigger_set_order_acceptance_deadline
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_acceptance_deadline();

-- 1. BACKWARD FIX: Set deadline for existing pending orders that have none
UPDATE orders 
SET acceptance_deadline = created_at + INTERVAL '5 minutes' 
WHERE acceptance_deadline IS NULL 
AND status = 'pending';

-- 2. EXPIRE LEGACY ORDERS: Mark pending orders as expired if deadline passed
UPDATE orders
SET status = 'expired'
WHERE status = 'pending'
AND acceptance_deadline < CURRENT_TIMESTAMP;
