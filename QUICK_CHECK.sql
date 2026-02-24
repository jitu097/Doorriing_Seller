-- ============================================
-- QUICK DIAGNOSTIC - Run this in Supabase SQL Editor
-- ============================================

-- 1. CHECK YOUR SHOP
SELECT 
    '1. YOUR RESTAURANT SHOP' as step,
    id as shop_id,
    name as shop_name,
    business_type,
    user_id
FROM shops 
WHERE business_type = 'restaurant'
LIMIT 1;

-- 2. CHECK ALL BOOKINGS
SELECT 
    '2. ALL BOOKINGS IN DATABASE' as step,
    id,
    shop_id,
    customer_name,
    customer_phone,
    number_of_guests,
    booking_date,
    booking_time,
    status
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- 3. CHECK IF SHOP_ID MATCHES
SELECT 
    '3. SHOP_ID MATCH CHECK' as step,
    b.shop_id as booking_shop_id,
    s.id as actual_shop_id,
    s.name as shop_name,
    COUNT(b.id) as num_bookings,
    CASE 
        WHEN b.shop_id = s.id THEN '✅ MATCH - OK'
        ELSE '❌ MISMATCH - PROBLEM!'
    END as status
FROM bookings b
LEFT JOIN shops s ON s.business_type = 'restaurant'
GROUP BY b.shop_id, s.id, s.name;

-- 4. FIX SHOP_ID (uncomment to run)
/*
WITH restaurant_shop AS (
    SELECT id FROM shops WHERE business_type = 'restaurant' LIMIT 1
)
UPDATE bookings 
SET shop_id = (SELECT id FROM restaurant_shop)
WHERE shop_id != (SELECT id FROM restaurant_shop) OR shop_id IS NULL;

SELECT 'Fixed! All bookings now use correct shop_id' as message;
*/
