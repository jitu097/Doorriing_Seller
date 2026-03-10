# Seller Notification System

## Database Structure & Optimizations
- Reused the existing `notifications` table; no schema changes beyond performance updates.
- Added the composite index `idx_notifications_shop_created_at` on `(shop_id, created_at DESC)` to speed up lookups and ordering ([backend/migrations/20260310_add_notification_indexes.sql](backend/migrations/20260310_add_notification_indexes.sql)).
- Created database triggers to guarantee notifications for events that may originate outside this codebase:
  - `trg_notify_order_insert` fires after every `orders` insert and records a `New Order Placed` notification.
  - `trg_notify_withdraw_update` fires when a `seller_withdraw_requests` row transitions to `approved`.

## Backend APIs
- Seller-facing notification endpoints now live under `/api/seller/notifications`:
  - `GET /api/seller/notifications?limit=20` → paginated list (limit capped at 50) ([backend/src/modules/notification/notification.controller.js](backend/src/modules/notification/notification.controller.js)).
  - `GET /api/seller/notifications/unread-count` → `{ count }` envelope.
  - `PATCH /api/seller/notifications/:id/read` → marks a single notification as read.
  - `PATCH /api/seller/notifications/read-all` → bulk mark-all.
- Routes remain guarded by `verifyToken`, `loadSeller`, and `loadShop` ensuring sellers only read their own records ([backend/src/modules/notification/notification.routes.js](backend/src/modules/notification/notification.routes.js)).
- Service layer enforces indexed queries with explicit column selection and head-count queries ([backend/src/modules/notification/notification.service.js](backend/src/modules/notification/notification.service.js)).

## Notification Triggers
- **Order placed**: database trigger inserts a `order_new` notification as soon as an order row lands.
- **Restaurant booking created**: booking service continues to push notifications on creation/updates ([backend/src/modules/booking/booking.service.js](backend/src/modules/booking/booking.service.js)).
- **Withdraw request submitted**: seller-initiated requests now enqueue a `withdraw_submitted` notification immediately ([backend/src/modules/wallet/withdraw.service.js](backend/src/modules/wallet/withdraw.service.js)).
- **Withdraw approved**: trigger on `seller_withdraw_requests` updates emits a `withdraw_approved` alert.
- **Seller account created**: onboarding flow drops a welcome notification after `shops` insert ([backend/src/modules/shop/shop.service.js](backend/src/modules/shop/shop.service.js)).

## Frontend Integration
- The navbar notification bell now consumes the seller-only endpoints via the updated service wrapper ([frontend/src/services/notificationService.js](frontend/src/services/notificationService.js)).
- `NotificationBell` automatically polls `/api/seller/notifications/unread-count` and opens the dropdown with `/api/seller/notifications` so sellers only see their own data ([frontend/src/components/common/NotificationBell.jsx](frontend/src/components/common/NotificationBell.jsx)).

## Additional Improvements
- Notification queries clamp `limit` values (1–50) to avoid unbounded scans.
- Unread counts use `head` requests, reducing payload and latency.
- All new notification side-effects run inside `try/catch` blocks to avoid impacting primary business flows.
