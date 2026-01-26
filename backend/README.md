# BazarSe Seller Backend

 Production-ready backend for BazarSe hyperlocal delivery platform (Seller Dashboard).

## Tech Stack
- **Runtime**: Node.js (LTS >= 18.0.0)
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: Firebase Admin SDK (ID Token Verification)
- **Caching**: In-memory Map (Redis-ready)

## Features
- ✅ Firebase token-based authentication
- ✅ Role-based access control (seller-only)
- ✅ One seller → one shop constraint
- ✅ Production-optimized queries (single joins, pagination)
- ✅ In-memory caching with TTL
- ✅ Comprehensive error handling
- ✅ Input validation and sanitization
- ✅ Automatic inventory logging
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Graceful shutdown

## Prerequisites
1. Node.js 18+ installed
2. Firebase project with Admin SDK credentials
3. Supabase project with service role key
4. Database tables created (see schema in requirements)

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Fill in `.env` with your credentials:

```env
# Server
PORT=3000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: CORS (use specific origins in production)
CORS_ORIGIN=http://localhost:5173
```

**Getting Firebase Credentials:**
- Go to Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key"
- Extract `project_id`, `client_email`, and `private_key` from downloaded JSON

**Getting Supabase Credentials:**
- Go to Supabase Dashboard → Project Settings → API
- Copy Project URL and Service Role Key (⚠️ Keep secret!)

## Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start on `http://localhost:3000`

Health check: `GET /health`

## API Endpoints

### Authentication
- `POST /api/v1/auth/bootstrap` - Create/fetch seller account
- `GET /api/v1/auth/profile` - Get seller profile with shop

### Shop Management
- `POST /api/v1/shop` - Create shop (one per seller)
- `GET /api/v1/shop` - Get shop details
- `PATCH /api/v1/shop` - Update shop info
- `PATCH /api/v1/shop/status` - Toggle open/closed

### Categories
- `POST /api/v1/categories` - Create category
- `GET /api/v1/categories` - List all categories
- `PATCH /api/v1/categories/:id` - Update category
- `PATCH /api/v1/categories/:id/visibility` - Show/hide category

### Items/Products
- `POST /api/v1/items` - Add new item
- `GET /api/v1/items?categoryId=uuid` - List items (optional filter)
- `GET /api/v1/items/:id` - Get item details
- `PATCH /api/v1/items/:id` - Update item
- `PATCH /api/v1/items/:id/stock` - Update stock quantity
- `PATCH /api/v1/items/:id/availability` - Mark available/unavailable

### Orders (Read-Only for Sellers)
- `GET /api/v1/orders?page=1&limit=20&status=Pending` - List orders
- `GET /api/v1/orders/stats` - Order statistics
- `GET /api/v1/orders/:id` - Order details with items
- `PATCH /api/v1/orders/:id/status` - Update order status

### Discounts
- `POST /api/v1/discounts` - Create discount code
- `GET /api/v1/discounts` - List all discounts
- `PATCH /api/v1/discounts/:id` - Update discount
- `PATCH /api/v1/discounts/:id/toggle` - Activate/deactivate

### Reviews
- `GET /api/v1/reviews?page=1&limit=20` - List reviews
- `GET /api/v1/reviews/stats` - Rating statistics
- `PATCH /api/v1/reviews/:id/visibility` - Show/hide review
- `PATCH /api/v1/reviews/:id/respond` - Respond to review

### Bookings (Restaurant sellers)
- `GET /api/v1/bookings?page=1&date=2024-01-25` - List bookings
- `GET /api/v1/bookings/today` - Today's bookings
- `PATCH /api/v1/bookings/:id/status` - Update booking status

### Notifications
- `GET /api/v1/notifications` - Get notifications (20 latest)
- `GET /api/v1/notifications/unread-count` - Count unread
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/notifications/read-all` - Mark all read

### Analytics
- `GET /api/v1/analytics/daily?startDate=2024-01-01&endDate=2024-01-31` - Daily analytics
- `GET /api/v1/analytics/summary?days=7` - Summary stats

## Authentication Flow

1. **Client**: User signs in via Firebase Auth (frontend)
2. **Client**: Gets Firebase ID token
3. **Client**: Sends token in header: `Authorization: Bearer <token>`
4. **Server**: Verifies token with Firebase Admin SDK
5. **Server**: Extracts `firebaseUid` and `email`
6. **Server**: Loads seller from database (cached)
7. **Server**: Validates seller role and shop ownership
8. **Server**: Processes request

## Architecture

```
src/
├── config/          # Environment & SDK initialization
│   ├── env.js       # Config validation & export
│   ├── firebaseAdmin.js
│   └── supabaseClient.js
├── middlewares/     # Request pipeline
│   ├── auth.middleware.js      # Token verification
│   ├── seller.middleware.js    # Seller & shop loading
│   └── error.middleware.js     # Centralized error handler
├── modules/         # Feature modules (service-controller-route)
│   ├── auth/
│   ├── shop/
│   ├── category/
│   ├── item/
│   ├── order/
│   ├── discount/
│   ├── review/
│   ├── booking/
│   ├── notification/
│   └── analytics/
├── routes/          # Route aggregation
│   └── index.js
├── utils/           # Helpers
│   ├── cache.js     # In-memory cache with TTL
│   ├── errors.js    # Custom error classes
│   ├── response.js  # Response formatters
│   └── validators.js # Input validation
├── app.js           # Express app setup
└── server.js        # Server initialization
```

## Optimization Strategies

1. **Caching**: Seller and shop data cached (600s TTL)
2. **Pagination**: All list endpoints use LIMIT+OFFSET
3. **Single Queries**: Joined queries instead of N+1 problems
4. **Explicit Columns**: SELECT only needed fields
5. **Indexed Lookups**: Queries use indexed columns (shop_id, seller_id)
6. **Cache Invalidation**: Automatic on mutations

## Security Features

- ✅ Helmet.js security headers
- ✅ CORS with configurable origins
- ✅ Firebase token expiration handling
- ✅ Role-based access (seller-only)
- ✅ Shop ownership validation on all mutations
- ✅ Input validation and sanitization
- ✅ Service role key isolation (no frontend DB access)
- ✅ Environment variable validation on startup

## Error Handling

Standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ErrorType"
}
```

**Error Types:**
- `BadRequestError` (400): Invalid input
- `UnauthorizedError` (401): Missing/invalid token
- `ForbiddenError` (403): Insufficient permissions
- `NotFoundError` (404): Resource not found
- `ConflictError` (409): Duplicate resource
- `AppError` (500): Generic server error

## Database Schema Assumptions

**Required Tables:**
- `users` (id, firebase_uid, email, role, created_at)
- `business_types` (id, name)
- `shops` (id, seller_id, shop_name, category, is_open, etc.)
- `categories` (id, shop_id, name, is_hidden)
- `items` (id, shop_id, category_id, name, price, stock_quantity, is_available)
- `orders` (id, shop_id, status, total_amount, timestamps)
- `order_items` (id, order_id, item_id, quantity, price)
- `discounts` (id, shop_id, code, discount_type, discount_value, is_active)
- `discount_usage` (id, discount_id, user_id, order_id)
- `inventory_logs` (id, item_id, shop_id, change_type, quantity_before, quantity_after)
- `reviews` (id, shop_id, rating, comment, is_visible, seller_response)
- `notifications` (id, user_id, message, is_read)
- `bookings` (id, shop_id, customer_name, booking_date, status)
- `analytics_daily` (id, shop_id, date, total_orders, total_revenue)

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Configure `CORS_ORIGIN` to your frontend domain
3. Use process manager (PM2, systemd)
4. Set up reverse proxy (Nginx)
5. Enable HTTPS
6. Configure firewall rules
7. Set up logging service
8. Configure backup strategy

**PM2 Example:**
```bash
npm install -g pm2
pm2 start src/server.js --name bazarse-seller-api
pm2 startup
pm2 save
```

## Troubleshooting

**Server won't start:**
- Check all environment variables are set
- Verify Firebase credentials format
- Ensure Supabase URL is correct

**Authentication fails:**
- Verify Firebase token is valid (not expired)
- Check `FIREBASE_PRIVATE_KEY` has proper newlines (\n)
- Ensure user exists in `users` table with role='seller'

**Database errors:**
- Verify service role key permissions
- Check table names match exactly
- Ensure foreign keys are valid UUIDs

**Cache issues:**
- Clear cache by restarting server
- For Redis migration, see `utils/cache.js`

## License

Proprietary - BazarSe Platform
