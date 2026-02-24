-- ================================================
-- BOOKING TROUBLESHOOTING SQL SCRIPT
-- Run these queries in Supabase SQL Editor
-- ================================================

-- =====================================
-- STEP 1: CHECK YOUR SHOP ID
-- =====================================
-- This shows your restaurant shop
SELECT 
    id as shop_id,
    name as shop_name,
    business_type,
    user_id,
    created_at
FROM shops 
WHERE business_type = 'restaurant'
ORDER BY created_at DESC;

-- Copy the 'shop_id' from the result above
-- You'll need it for the next steps!


-- =====================================
-- STEP 2: CHECK EXISTING BOOKINGS
-- =====================================
-- See all bookings in database
SELECT 
    id,
    shop_id,
    customer_name,
    customer_phone,
    number_of_guests,
    booking_date,
    booking_time,
    status,
    created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 20;


-- =====================================
-- STEP 3: CHECK SHOP_ID MATCH
-- =====================================
-- This shows bookings with shop name (to verify matching)
SELECT 
    b.id as booking_id,
    b.shop_id,
    s.name as shop_name,
    b.customer_name,
    b.booking_date,
    b.booking_time,
    b.status,
    CASE 
        WHEN s.id IS NULL THEN '❌ ORPHANED - No matching shop!'
        WHEN s.business_type != 'restaurant' THEN '⚠️ Wrong business type'
        ELSE '✅ OK'
    END as shop_match_status
FROM bookings b
LEFT JOIN shops s ON b.shop_id = s.id
ORDER BY b.created_at DESC;


-- =====================================
-- STEP 4: FIX SHOP_ID (IF NEEDED)
-- =====================================
-- ⚠️ IMPORTANT: Replace 'YOUR_SHOP_ID_HERE' with the actual shop_id from STEP 1!
-- Uncomment and run ONLY if shop_id is wrong

/*
UPDATE bookings 
SET shop_id = 'YOUR_SHOP_ID_HERE'
WHERE shop_id != 'YOUR_SHOP_ID_HERE' OR shop_id IS NULL;

-- Verify the update
SELECT COUNT(*) as updated_bookings FROM bookings WHERE shop_id = 'YOUR_SHOP_ID_HERE';
*/


-- =====================================
-- STEP 5: FIX DATE FORMAT (IF NEEDED)
-- =====================================
-- Check if dates are in correct format
SELECT 
    booking_date,
    to_char(booking_date, 'YYYY-MM-DD') as formatted_date,
    CASE 
        WHEN booking_date::text ~ '^\d{4}-\d{2}-\d{2}' THEN '✅ OK'
        ELSE '❌ Wrong format'
    END as date_status
FROM bookings;


-- =====================================
-- STEP 6: CREATE TEST BOOKING
-- =====================================
-- Create a test booking for today
-- ⚠️ Replace 'YOUR_SHOP_ID_HERE' with actual shop_id

/*
INSERT INTO bookings (
    shop_id,
    customer_name,
    customer_phone,
    number_of_guests,
    booking_date,
    booking_time,
    status
) VALUES (
    'YOUR_SHOP_ID_HERE',
    'Test Customer',
    '9876543210',
    4,
    CURRENT_DATE,
    '19:00',
    'Pending'
);

-- Check if it was created
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;
*/


-- =====================================
-- STEP 7: CHECK TODAY'S BOOKINGS
-- =====================================
-- This is what the dashboard shows
-- ⚠️ Replace 'YOUR_SHOP_ID_HERE' with actual shop_id

/*
SELECT 
    customer_name,
    customer_phone,
    number_of_guests,
    booking_time,
    status
FROM bookings
WHERE shop_id = 'YOUR_SHOP_ID_HERE'
  AND booking_date = CURRENT_DATE
  AND status IN ('Pending', 'Confirmed')
ORDER BY booking_time ASC;
*/


-- =====================================
-- STEP 8: VERIFY TABLE STRUCTURE
-- =====================================
-- Check if bookings table has correct columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;


-- =====================================
-- STEP 9: CHECK ROW LEVEL SECURITY (RLS)
-- =====================================
-- See if RLS is blocking access
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'bookings';

-- If RLS is enabled, check policies
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'bookings';


-- =====================================
-- FULL DIAGNOSTIC REPORT
-- =====================================
-- Run this to get complete overview
SELECT 
    'Total Bookings' as metric,
    COUNT(*)::text as value
FROM bookings
UNION ALL
SELECT 
    'Pending Bookings',
    COUNT(*)::text
FROM bookings WHERE status = 'Pending'
UNION ALL
SELECT 
    'Today''s Bookings',
    COUNT(*)::text
FROM bookings WHERE booking_date = CURRENT_DATE
UNION ALL
SELECT 
    'Unique Shops',
    COUNT(DISTINCT shop_id)::text
FROM bookings
UNION ALL
SELECT 
    'Orphaned Bookings (no shop)',
    COUNT(*)::text
FROM bookings b
LEFT JOIN shops s ON b.shop_id = s.id
WHERE s.id IS NULL;


-- =====================================
-- EMERGENCY FIX: RESET ALL TO YOUR SHOP
-- =====================================
-- ⚠️⚠️⚠️ USE WITH CAUTION ⚠️⚠️⚠️
-- This updates ALL bookings to use your shop_id
-- Only use if you're sure all bookings belong to one restaurant
-- Replace 'YOUR_SHOP_ID_HERE' with actual shop_id

/*
BEGIN;

-- Update all bookings to your shop
UPDATE bookings SET shop_id = 'YOUR_SHOP_ID_HERE';

-- Verify changes before committing
SELECT 
    COUNT(*) as total_bookings,
    shop_id,
    (SELECT name FROM shops WHERE id = bookings.shop_id LIMIT 1) as shop_name
FROM bookings
GROUP BY shop_id;

-- If everything looks good, uncomment next line to commit:
-- COMMIT;

-- If something is wrong, uncomment next line to rollback:
-- ROLLBACK;
*/
