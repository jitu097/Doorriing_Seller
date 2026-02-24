-- ================================================
-- FIX BOOKINGS SHOP_ID MISMATCH
-- ================================================
-- This will update all bookings to use your restaurant's shop_id

-- STEP 1: Find your restaurant shop_id
SELECT 
    'STEP 1: Your Restaurant Shop ID' as info,
    id as your_shop_id,
    name as shop_name,
    business_type,
    user_id
FROM shops 
WHERE business_type = 'restaurant'
ORDER BY created_at DESC
LIMIT 1;

-- STEP 2: See current bookings and their shop_ids
SELECT 
    'STEP 2: Current Bookings' as info,
    id as booking_id,
    shop_id as current_shop_id,
    customer_name,
    booking_date,
    status
FROM bookings
ORDER BY created_at DESC;

-- STEP 3: FIX - Update all bookings to use your shop_id
-- ⚠️ IMPORTANT: Copy your shop_id from STEP 1 and replace 'YOUR_SHOP_ID_HERE' below

/*
UPDATE bookings 
SET shop_id = 'YOUR_SHOP_ID_HERE'
WHERE shop_id != 'YOUR_SHOP_ID_HERE' OR shop_id IS NULL;
*/

-- STEP 4: Verify the fix
/*
SELECT 
    'STEP 4: Verification' as info,
    COUNT(*) as total_bookings,
    shop_id,
    (SELECT name FROM shops WHERE id = bookings.shop_id LIMIT 1) as shop_name
FROM bookings
GROUP BY shop_id;
*/

-- ================================================
-- AUTOMATIC FIX (ONE-CLICK SOLUTION)
-- ================================================
-- This automatically finds your restaurant and updates all bookings
-- Just uncomment and run this entire block:

/*
DO $$
DECLARE
    restaurant_shop_id UUID;
BEGIN
    -- Get restaurant shop_id
    SELECT id INTO restaurant_shop_id 
    FROM shops 
    WHERE business_type = 'restaurant' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Update all bookings
    UPDATE bookings SET shop_id = restaurant_shop_id;
    
    -- Show result
    RAISE NOTICE 'Updated % bookings to use shop_id: %', 
        (SELECT COUNT(*) FROM bookings),
        restaurant_shop_id;
END $$;

-- Verify
SELECT 
    b.id,
    b.customer_name,
    b.booking_date,
    b.status,
    s.name as shop_name,
    '✅ Fixed!' as status_indicator
FROM bookings b
JOIN shops s ON b.shop_id = s.id
ORDER BY b.created_at DESC;
*/
