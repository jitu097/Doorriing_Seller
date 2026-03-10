-- Composite index to speed up seller notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_shop_created_at
    ON public.notifications (shop_id, created_at DESC);

-- Ensure inserts on orders automatically generate seller notifications
CREATE OR REPLACE FUNCTION public.trg_notify_seller_on_order_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.shop_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (
        shop_id,
        customer_id,
        title,
        message,
        type,
        reference_id,
        is_read,
        created_at
    ) VALUES (
        NEW.shop_id,
        NEW.customer_id,
        'New Order Placed',
        'Order #' || COALESCE(NEW.order_number::text, NEW.id::text) || ' has been placed.',
        'order_new',
        NEW.id,
        false,
        NOW()
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_order_insert ON public.orders;
CREATE TRIGGER trg_notify_order_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trg_notify_seller_on_order_insert();

-- Notify sellers whenever a withdrawal request transitions to approved
CREATE OR REPLACE FUNCTION public.trg_notify_withdraw_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.shop_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE'
       AND NEW.status = 'approved'
       AND COALESCE(OLD.status, '') <> 'approved' THEN
        INSERT INTO public.notifications (
            shop_id,
            title,
            message,
            type,
            reference_id,
            is_read,
            created_at
        ) VALUES (
            NEW.shop_id,
            'Withdrawal Approved',
            'Your withdrawal request has been approved and is being processed.',
            'withdraw_approved',
            NEW.id,
            false,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_withdraw_update ON public.seller_withdraw_requests;
CREATE TRIGGER trg_notify_withdraw_update
AFTER UPDATE ON public.seller_withdraw_requests
FOR EACH ROW
EXECUTE FUNCTION public.trg_notify_withdraw_status();
