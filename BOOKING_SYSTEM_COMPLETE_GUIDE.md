# Restaurant Booking System - Complete Guide

## Overview
This system allows restaurant customers to make table bookings and enables restaurant owners to manage these bookings with real-time notifications.

## Features

### For Customers (User Side)
- Create table bookings via public API endpoint
- Specify date, time, number of guests, and contact information

### For Restaurant Owners (Seller Side)
- View all bookings with filters (status, date)
- See today's bookings on dashboard
- Receive real-time notifications for new bookings
- Update booking status (Confirm, Cancel, Complete)
- Track booking history

## Architecture

### Database Table: `bookings`
```sql
- id (UUID, primary key)
- shop_id (UUID, foreign key to shops)
- customer_name (text)
- customer_phone (text)
- number_of_guests (integer)
- booking_date (date)
- booking_time (time)
- status (text: Pending, Confirmed, Cancelled, Completed)
- created_at (timestamp)
- updated_at (timestamp)
```

## Implementation Guide

### 1. Customer Booking (User App)

#### API Endpoint
**POST** `/api/bookings/create` (Public - No Auth Required)

**Request Body:**
```json
{
  "shop_id": "uuid-of-restaurant",
  "customer_name": "Kushal Priya",
  "customer_phone": "6205335018",
  "number_of_guests": 4,
  "booking_date": "2026-02-27",
  "booking_time": "19:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking-uuid",
    "shop_id": "shop-uuid",
    "customer_name": "Kushal Priya",
    "customer_phone": "6205335018",
    "number_of_guests": 4,
    "booking_date": "2026-02-27",
    "booking_time": "19:00",
    "status": "Pending",
    "created_at": "2026-02-24T10:30:00Z"
  }
}
```

#### What Happens Automatically:
1. ✅ Booking is created with "Pending" status
2. ✅ Notification is sent to restaurant owner
3. ✅ Booking appears in seller dashboard
4. ✅ Notification bell shows unread count

### 2. Seller Side (Restaurant Owner)

#### Accessing Bookings

**Dashboard View** (`/restaurant/dashboard`)
- Shows today's bookings at a glance
- Quick overview of pending/confirmed bookings today

**Bookings Page** (`/restaurant/bookings`)
- Complete list of all bookings
- Filter by status: All, Pending, Confirmed, Cancelled, Completed
- Filter by date
- Pagination support

#### Managing Bookings

**Get All Bookings**
```javascript
const bookings = await bookingService.getBookings({
  status: 'Pending',  // Optional
  date: '2026-02-27', // Optional
  page: 1,            // Optional
  limit: 20           // Optional
});
```

**Get Today's Bookings**
```javascript
const todayBookings = await bookingService.getTodayBookings();
```

**Update Booking Status**
```javascript
await bookingService.updateStatus(bookingId, 'Confirmed');
// Status options: Pending, Confirmed, Cancelled, Completed
```

### 3. Notification System

#### Automatic Notifications

**New Booking Created:**
- **Title:** "New Booking Received"
- **Message:** "{customer_name} booked a table for {guests} guests on {date} at {time}"
- **Type:** `booking_new`

**Booking Status Updated:**
- **Title:** "Booking Status Updated"
- **Message:** "Booking for {customer_name} has been {confirmed/cancelled/completed}"
- **Type:** `booking_confirmed`, `booking_cancelled`, `booking_completed`

#### Viewing Notifications
- Click the 🔔 bell icon in the navbar
- Red badge shows unread count
- Click notification to navigate to bookings page
- Notifications auto-refresh every 30 seconds

## Alternative: Database Triggers (Advanced)

If you want notifications even when bookings are inserted directly into the database (not via API), set up a Supabase database trigger:

### Create Notification Function
```sql
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    shop_id,
    title,
    message,
    type,
    reference_id,
    reference_type,
    is_read
  )
  VALUES (
    NEW.shop_id,
    'New Booking Received',
    NEW.customer_name || ' booked a table for ' || NEW.number_of_guests || 
    ' guests on ' || NEW.booking_date || ' at ' || NEW.booking_time,
    'booking_new',
    NEW.id,
    'booking',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Create Trigger
```sql
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();
```

## Frontend Components

### Files Created/Modified:
1. **`frontend/src/pages/Restaurant/Booking.jsx`** - Main bookings page
2. **`frontend/src/pages/Restaurant/Booking.css`** - Bookings styles
3. **`frontend/src/pages/Restaurant/Dashboard.jsx`** - Updated with today's bookings
4. **`frontend/src/pages/Restaurant/Dashboard.css`** - Added booking styles
5. **`frontend/src/services/bookingService.js`** - Already existed
6. **`frontend/src/components/common/NotificationBell.jsx`** - Already handles booking notifications

### Backend Files Modified:
1. **`backend/src/modules/booking/booking.service.js`** - Added createBooking and notification integration
2. **`backend/src/modules/booking/booking.controller.js`** - Added createBooking controller
3. **`backend/src/modules/booking/booking.routes.js`** - Added public booking creation route

## Testing the System

### 1. Create a Test Booking (Customer Side)
```bash
curl -X POST http://localhost:5000/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "your-shop-id",
    "customer_name": "Test Customer",
    "customer_phone": "1234567890",
    "number_of_guests": 2,
    "booking_date": "2026-02-25",
    "booking_time": "18:00"
  }'
```

### 2. Check Seller Dashboard
- Login to seller account
- Navigate to `/restaurant/dashboard`
- You should see the booking in "Today's Bookings"
- Notification bell should show badge

### 3. Manage the Booking
- Click "View All Bookings" or navigate to `/restaurant/bookings`
- Find the booking
- Click "Confirm" or "Cancel"
- Check that notification is created

## Status Flow

```
Pending (Initial)
  ↓
  ├─→ Confirmed (Owner accepts)
  │     ↓
  │     ├─→ Completed (Service finished)
  │     └─→ Cancelled (Cancelled after confirmation)
  │
  └─→ Cancelled (Owner rejects)
```

## Best Practices

1. **Customer App Integration:**
   - Always validate phone number format
   - Check restaurant's operating hours before allowing booking
   - Show confirmation to customer after booking

2. **Seller Dashboard:**
   - Regularly check today's bookings
   - Respond to pending bookings quickly
   - Mark completed bookings at end of day

3. **Notifications:**
   - Check notifications regularly
   - Mark as read to keep dashboard clean
   - Use filters to find specific bookings

## Common Issues & Solutions

### Issue: Notifications not appearing
**Solution:** 
- Check notification service is running
- Verify shop_id is correct in booking
- Check browser console for errors

### Issue: Bookings not showing on dashboard
**Solution:**
- Verify booking_date is today's date
- Check status is "Pending" or "Confirmed"
- Refresh the page

### Issue: Can't update booking status
**Solution:**
- Ensure you're logged in as the correct shop owner
- Verify shop_id matches in booking
- Check backend logs for errors

## Future Enhancements

- [ ] SMS notifications to customers
- [ ] WhatsApp integration
- [ ] Auto-cancellation for old pending bookings
- [ ] Table management system
- [ ] Capacity management
- [ ] Booking time slots
- [ ] Customer booking history
- [ ] Rating system after completion

## Support

For issues or questions, check:
1. Backend logs: `backend/logs/`
2. Browser console
3. Supabase dashboard for database issues
4. Network tab for API call failures
