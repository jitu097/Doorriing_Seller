# Booking Troubleshooting Guide

## Problem: Bookings in database but not showing in seller app

### Step 1: Check Backend Logs
1. Open your backend terminal
2. Look for these log messages when you visit `/restaurant/bookings`:
   ```
   📋 Fetching bookings for shop_id: <your-shop-id>
   ✅ Found X bookings, returning X for this page
   ```

### Step 2: Check Database Directly

Open Supabase SQL Editor or your database tool and run:

```sql
-- Check all bookings in database
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;

-- Check your shop_id
SELECT id, name, business_type FROM shops WHERE business_type = 'restaurant';

-- Check if shop_id matches
SELECT 
    b.*,
    s.name as shop_name,
    s.business_type
FROM bookings b
LEFT JOIN shops s ON b.shop_id = s.id
ORDER BY b.created_at DESC;
```

### Step 3: Verify shop_id Match

The most common issue is **shop_id mismatch**. Your bookings must have the same `shop_id` as your logged-in shop.

#### Check what shop_id the seller is logged in as:
1. Open browser console (F12)
2. Go to Network tab
3. Visit `/restaurant/bookings`
4. Look for the API call to `/api/bookings`
5. Check the logged shop ID in the backend terminal

#### Fix shop_id if needed:

```sql
-- First, find your correct shop_id
SELECT id, name FROM shops WHERE business_type = 'restaurant';

-- Update all bookings to use correct shop_id (REPLACE 'your-correct-shop-id')
UPDATE bookings 
SET shop_id = 'your-correct-shop-id'
WHERE shop_id != 'your-correct-shop-id';
```

### Step 4: Use Debug Endpoint

Visit this URL in your browser (no authentication needed):
```
http://localhost:5000/api/bookings/debug/all
```

This will show you:
- Latest 10 bookings in database
- All their data including shop_id

Compare the `shop_id` in the response with your logged-in shop's ID.

### Step 5: Check Browser Console

1. Open browser console (F12)
2. Navigate to `/restaurant/bookings`
3. Look for these messages:
   ```
   📋 Fetching bookings with filters: {page: 1, limit: 20}
   ✅ Received bookings response: {bookings: Array(3), pagination: {...}}
   ```

4. If you see:
   ```
   ⚠️ No bookings returned from API
   ```
   Then the issue is shop_id mismatch or authentication.

### Step 6: Create Test Booking

Use this curl command or Postman to create a test booking:

```bash
curl -X POST http://localhost:5000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "YOUR-SHOP-ID-HERE",
    "customer_name": "Test Customer",
    "customer_phone": "1234567890",
    "number_of_guests": 2,
    "booking_date": "2026-02-25",
    "booking_time": "18:00"
  }'
```

**Important:** Replace `YOUR-SHOP-ID-HERE` with your actual shop ID!

### Step 7: Check Database Schema

Ensure your bookings table has the correct structure:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid)
- `shop_id` (uuid) - MUST match shops.id
- `customer_name` (text)
- `customer_phone` (text)
- `number_of_guests` (integer)
- `booking_date` (date)
- `booking_time` (text or time)
- `status` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Common Issues & Solutions

#### Issue 1: shop_id Mismatch
**Symptom:** Bookings exist but show as empty array
**Solution:** Update bookings with correct shop_id (see Step 3)

#### Issue 2: Wrong Date Format
**Symptom:** Today's bookings not showing on dashboard
**Solution:** Ensure booking_date is in format `YYYY-MM-DD` (e.g., `2026-02-24`)

```sql
-- Check date format
SELECT booking_date, to_char(booking_date, 'YYYY-MM-DD') FROM bookings;

-- Fix date if needed
UPDATE bookings SET booking_date = '2026-02-24' WHERE id = 'booking-id';
```

#### Issue 3: Authentication Issues
**Symptom:** API returns 401 or 403
**Solution:** Make sure you're logged in and have a restaurant shop

#### Issue 4: CORS or Network Errors
**Symptom:** API calls fail in browser console
**Solution:** Check backend is running on correct port and CORS is enabled

### Quick Fix SQL Script

If you know your correct shop_id, run this:

```sql
-- Replace 'YOUR_CORRECT_SHOP_ID' with actual shop ID
DO $$
DECLARE
    correct_shop_id UUID := 'YOUR_CORRECT_SHOP_ID';
BEGIN
    -- Update all bookings to use correct shop_id
    UPDATE bookings SET shop_id = correct_shop_id;
    
    -- Show updated bookings
    RAISE NOTICE 'Updated % bookings', (SELECT COUNT(*) FROM bookings);
END $$;

-- Verify
SELECT id, shop_id, customer_name, booking_date, status FROM bookings;
```

### Testing Checklist

- [ ] Backend server is running
- [ ] Logged in as restaurant owner
- [ ] Shop has business_type = 'restaurant'
- [ ] Bookings have matching shop_id
- [ ] Date format is YYYY-MM-DD
- [ ] Status is valid (Pending, Confirmed, Cancelled, Completed)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

### Still Not Working?

1. **Restart backend server** to load new code
2. **Clear browser cache** and refresh
3. **Check backend terminal** for error messages
4. **Send me the output** of:
   - Debug endpoint: `/api/bookings/debug/all`
   - Shop query: `SELECT * FROM shops WHERE business_type = 'restaurant'`
   - Console logs when visiting bookings page
