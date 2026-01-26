# BazarSe Seller - Database Schema Guide (MVP - Seller Side)

## 📋 Overview

This guide provides the **MVP database schema** specifically for the **BazarSe Seller Side** platform. This is optimized for sellers to manage their shops efficiently.

### Architecture
- **Authentication**: Firebase Auth (seller login/signup)
- **Database**: Supabase (PostgreSQL) 
- **Storage**: Supabase Storage (shop & product images)
- **Categories**: Grocery & Restaurant only

### Design Principles
✅ **MVP-First**: Only essential tables for launch  
✅ **Seller-Focused**: Optimized for seller operations  
✅ **Performance**: Indexed for fast queries  
✅ **Scalable**: Easy to extend later  

---

## 🗄️ Core Database Tables (MVP)

### 1. **sellers** (Seller Authentication Link)
Links Firebase Auth UID to seller profile - minimal and focused.

```sql
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_sellers_firebase_uid ON sellers(firebase_uid);
CREATE INDEX idx_sellers_email ON sellers(email);
```

**Purpose**: Minimal seller authentication table. Owner name and details stored in shops table.

---

### 2. **shops** (Shop/Store Information)
Stores complete shop details from registration form.
Complete Shop Profile)
All registration form data and shop settings in one table for simplicity.

```sql
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    
    -- Basic Information (from registration form)
    shop_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Category
    category VARCHAR(50) NOT NULL CHECK (category IN ('Grocery', 'Restaurant')),
    subcategory VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Address (Fixed for MVP)
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Latehar',
    state VARCHAR(100) NOT NULL DEFAULT 'Jharkhand',
    pincode VARCHAR(10) NOT NULL DEFAULT '829206',
    
    -- Business Documents
    pan_card VARCHAR(10) NOT NULL,
    aadhaar_number VARCHAR(12) NOT NULL,
    business_license VARCHAR(100),
    tax_id VARCHAR(100),
    website VARCHAR(255),
    
    -- Media
    shop_photo_url TEXT,
    
    -- Shop Settings (Operating Hours - Simple JSON for MVP)
    operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "21:00", "closed": false},
        "tuesday": {"open": "09:00", "close": "21:00", "closed": false},
        "wednesday": {"open": "09:00", "close": "21:00", "closed": false},
        "thursday": {"open": "09:00", "close": "21:00", "closed": false},
        "friday": {"open": "09:00", "close": "21:00", "closed": false},
        "saturday": {"open": "09:00", "close": "21:00", "closed": false},
        "sunday": {"open": "09:00", "close": "21:00", "closed": false}
    }'::jsonb,
    
    -- Delivery Settings
    delivery_enabled BOOLEAN DEFAULT TRUE,
    delivery_charge DECIMAL(6, 2) DEFAULT 0,
    min_order_amount DECIMAL(8, 2) DEFAULT 0,
    
    -- Shop Status
    is_open BOOLEAN DEFAULT TRUE,
    is_accepting_orders BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
Seller-created categories to organize products/menu items.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique category names per shop
    CONSTRAINT unique_shop_category UNIQUE (shop_id, name)
);

-- Indexes
CREATE INDEX idx_categories_shop_id ON categories(shop_id);
CREATE INDEX idx_categories_display_order ON categories(display_order);
```

**Examples**: "Vegetables", "Dairy" (Grocery) or "Starters", "Main Course" (Restaurant)
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate category names per shop
    CONSTRAINT unique_shop_category UNIQUE (shop_id, name)
);

-- Indexes
CREATE INDEX idx_categories_shop_id ON categories(shop_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);
```

**Purpose**: Dynamic categories created by sellers (different from main category Grocery/Restaurant).

---

### 4. **items** (Products/Menu Items)
All products for Grocery or menu items for Restaurant.

Products for Grocery shops or menu items for Restaurants.

```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    
    -- Pricing
    price DECIMAL(8, 2) NOT NULL CHECK (price >= 0),
    half_portion_price DECIMAL(8, 2) CHECK (half_portion_price >= 0), -- Restaurant only
    
    -- Inventory (Grocery only)
    stock_quantity INTEGER DEFAULT 0,
    unit VARCHAR(30), -- 'kg', 'liter', 'piece', 'dozen', etc.
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_items_shop_id ON items(shop_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_is_available ON items(is_available);
CREATE INDEX idx_items_name ON items(name);
```

**Fields**:
- `half_portion_price`: For restaurants (half plate option)
- `stock_quantity` + `unit`: For grocery inventory
- `is_available`: Quick toggle when out of stock

### 5. **orders** (Customer Orders)
Orders placed by customers (from customer app).

```sql - Read Only for Sellers)
Orders from customers (created by customer app, managed by sellers).

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., "ORD1234567890"
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    
    -- Customer Info (from customer app)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    
    -- Amounts
    items_total DECIMAL(8, 2) NOT NULL,
    delivery_charge DECIMAL(6, 2) DEFAULT 0,
    total_amount DECIMAL(8, 2) NOT NULL,
    
    -- Order Status (Seller Updates This)
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (
        status IN ('Pending', 'Confirmed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled')
    ),
    
    -- Payment
    payment_method VARCHAR(20) DEFAULT 'COD' CHECK (
        payment_method IN ('COD', 'Online')
    ),
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (
        payment_status IN ('Pending', 'Paid')
    ),
    
    -- Notes
    customer_notes TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_orders_shop_id ON orders(shop_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
```
Items in Each Order)
Line items for each order with pricing snapshot.

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    
    -- Snapshot (frozen at order time, won't change if item is edited)
    item_name VARCHAR(255) NOT NULL,
    item_price DECIMAL(8, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_half_portion BOOLEAN DEFAULT FALSE, -- For restaurants
    subtotal DECIMAL(8, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
```

**Why Snapshot?** If seller changes item price later, old orders remain unchanged.Indexes
CREATE INDEX idx_order_items_order_id Reservations)
Table booking management - **Restaurant category only**.

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Customer Info
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    number_of_guests INTEGER NOT NULL CHECK (number_of_guests > 0),
    
    -- Booking Details
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    table_number VARCHAR(20),
    special_requests TEXT,
    
    -- Status (Seller Updates This)
    status VARCHAR(20) DEFAULT 'Pending' CHECK (
        status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled', 'NoShow')
    ),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_shop_id ON bookings(shop_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
```

**Seller Actions**: Confirm/cancel bookings, mark as completed/no-show CONSTRAINT unique_shop_date_analytics UNIQUE (shop_id, date)
);

-- Indexes
CREATE INDEX idx_analytics_daily_shop_id ON analytics_daily(shop_id);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);
```

---

## 🔐 Row Level Security (RLS) Policies

Enable RLS on all tables for security:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- Shops: Users can only manage their own shop
CREATE POLICY "Users can view own shop" ON shops
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );

CREATE POLICY "Users can insert own shop" ON shops
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );

CREATE POLICY "Users can update own shop" ON shops
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    );

-- Categories: Users can only manage their shop's categories
CREATE POLICY "Users can manage own shop categories" ON categories
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Items: Users can only manage their shop's items
CREATE POLICY "Users can manage own shop items" ON items
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Orders: Users can only view their shop's orders
CREATE POLICY "Users can view own shop orders" ON orders
    FOR SELECT USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can update own shop orders" ON orders
    FOR UPDATE USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Bookings: Restaurant owners can manage bookings
CREATE POLICY "Users can manage own restaurant bookings" ON bookings
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Shop Settings: Users can manage their shop settings
CREATE POLICY "Users can manage own shop settings" ON shop_settings
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
        Complete Shop Profile
```sql
SELECT 
    s.*,
    u.owner_name,
    u.email,
    u.phone,
    ss.is_open_now,
    ss.delivery_available,
    ss.delivery_charge
FROM shops s
JOIN users u ON s.user_id = u.id
LEFT JOIN shop_settings ss ON s.id = ss.shop_id
WHERE u.firebase_uid = 'FIREBASE_UID_HERE';
```

### Get         SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Discounts: Users can manage their shop discounts
CREATE POLICY "Users can manage own shop discounts" ON discounts
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Reviews: Users can view and respond to their shop reviews
CREATE POLICY "Users can view own shop reviews" ON reviews
    FOR SELECT USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can update own shop reviews" ON reviews
    FOR UPDATE USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Notifications: Users can view and update their shop notifications
CREATE POLICY "Users can manage own shop notifications" ON notifications
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Inventory Logs: Users can view their shop's inventory history
CREATE POLICY "Users can view own shop inventory logs" ON inventory_logs
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );

-- Analytics: Users can view their shop analytics
CREATE POLICY "Users can view own shop analytics" ON analytics_daily
    FOR ALL USING (
        shop_id IN (
            SELECT id FROM shops WHERE user_id IN (
                SELECT id FROM users WHERE firebase_uid = auth.uid()::text
            )
        )
    );
```

---

## 📊 Sample Queries

### Get Shop Info with Owner Details
```sql
SELECT 
    s.*,
    u.owner_name,
    u.email,
    u.phone
FROM shops s
JOIN users u ON s.user_id = u.id
WHERE u.firebase_uid = 'FIREBASE_UID_HERE';
```

### Get All Items for a Shop with Categories
```sql
SELECT 
    i.*,
    c.name as category_name
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.shop_id = 'SHOP_UUID_HERE'
ORDER BY c.display_order, i.name;
```

### Get Today's Orders for a Shop
```sql
SELECT 
    o.order_number,
    o.customer_name,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.shop_id = 'SHOP_UUID_HERE'
    AND DATE(o.created_at) = CURRENT_DATE
GRO

### Get Active Discounts
```sql
SELECT *
FROM discounts
WHERE shop_id = 'SHOP_UUID_HERE'
    AND is_active = TRUE
    AND (valid_until IS NULL OR valid_until > NOW())
    AND (usage_limit IS NULL OR times_used < usage_limit)
ORDER BY created_at DESC;
```

### Get Shop Reviews Summary
```sql
SELECT 
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating,
    COUNT(*) FILTER (WHERE rating = 5) as five_star,
    COUNT(*) FILTER (WHERE rating = 4) as four_star,
    COUNT(*) FILTER (WHERE rating = 3) as three_star,
    COUNT(*) FILTER (WHERE rating = 2) as two_star,
    COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM reviews
WHERE shop_id = 'SHOP_UUID_HERE'
    AND is_visible = TRUE;
```

### Get Unread Notifications
```sql
SELECT *
FROM notifications
WHERE shop_id = 'SHOP_UUID_HERE'
    AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 20;
```

### Get Weekly Analytics
```sql
SELECT 
    date,
    total_orders,
    completed_orders,
    total_revenue,
    average_order_value
FROM analytics_daily
WHERE shop_id = 'SHOP_UUID_HERE'
    AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### Get Low Stock Items (Grocery)
```sql
SELECT 
    i.name,
    i.quantity,
    i.unit,
    c.name as category_name
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.shop_id = 'SHOP_UUID_HERE'
    AND i.quantity IS NOT NULL
    AND i.quantity < 10
    AND i.is_active = TRUE
ORDER BY i.quantity ASC;
```UP BY o.id
ORDER BY o.created_at DESC;
```

### Get Order Statistics
```sql
SELECT 
    COUNT(*) FILTER (WHERE status = 'Pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'Confirmed') as confirmed_orders,
    COUNT(*) FILTER (WHERE status = 'Preparing') as preparing_orders,
    COUNT(*) FILTER (WHERE status = 'OutForDelivery') as out_for_delivery,
    COUNT(*) FILTER (WHERE status = 'Delivered') as delivered_orders,
    COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled_orders,
    SUM(total_amount) FILTER (WHERE status = 'Delivered') as total_revenue
FROM orders
WHERE shop_id = 'SHOP_UUID_HERE';
```

---

## 🎯 Workflow Integration

### Registration Flow
1. User signs up via Firebase Auth → Get `firebase_uid`
2. Create entry in `users` table with `firebase_uid`
3. User fills registration form → Create entry in `shops` table
4. Store `category` (Grocery/Restaurant) in `shops.category`
5. Store in localStorage: `localStorage.setItem('selectedCategory', category)`
6. Redirect to category-specific dashboard

### Login Flow
1. User logs in via Firebase → Get `firebase_uid`
2. Fetch user from `users` table
3. Fetch shop from `shops` table
4. Get `shops.category` → Store in localStorage
5. Redirect to appropriate dashboard (Grocery/Restaurant)

---

## 📦 Storage Buckets

Create storage buckets in Supabase:

### 1. **shop-photos**
```sql
-- Storage for shop images from registration

CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON shop_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
### Phase 1: Core Tables (Day 1)
1. Create: users → shops → shop_settings
2. Enable RLS and create policies
3. Test user registration flow

### Phase 2: Product/Menu Management (Day 2)
1. Create: categories → items → inventory_logs
2. Enable RLS and create policies
3. Test product creation and management

### Phase 3: Orders & Bookings (Day 3)
1. Create: orders → order_items → bookings
2. Enable RLS and create policies
3. Test order flow

### Phase 4: Marketing & Feedback (Day 4)
1. Create: discounts → discount_usage → reviews
2. Enable RLS and create policies
3. Test discount application

### Phase 5: Notifications & Analytics (Day 5)
1. Create: notifications → analytics_daily
2. Enable RLS and create policies
3. Create all triggers
4. Test complete flow

### Phase 6: Storage & Final Setup (Day 6)
1. Create storage buckets
2. Test image uploads
3. Populate sample data
4. Run all sample queries

### Auto-increment discount usage counter
```sql
CREATE OR REPLACE FUNCTION increment_discount_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE discounts
    SET times_used = times_used + 1
    WHERE id = NEW.discount_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_discount_on_usage
    AFTER INSERT ON discount_usage
    FOR EACH ROW EXECUTE FUNCTION increment_discount_usage();
```

### Auto-create notification on new order
```sql
CREATE OR REPLACE FUNCTION create_new_order_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (shop_id, title, message, type, reference_id, reference_type)
    VALUES (
        NEW.shop_id,
        'New Order Received',
        'Order #' || NEW.order_number || ' for ₹' || NEW.total_amount,
        'new_order',
        NEW.id,
        'order'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_new_order
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION create_new_order_notification();
```

### Auto-log inventory changes
```sql
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
        INSERT INTO inventory_logs (
            item_id,
            shop_id,
            change_type,
            quantity_before,
            quantity_change,
            quantity_after,
            notes
        ) VALUES (
            NEW.id,
            NEW.shop_id,
            'adjustment',
            COALESCE(OLD.quantity, 0),
            NEW.quantity - COALESCE(OLD.quantity, 0),
            NEW.quantity,
            'Manual update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_inventory_changes
    AFTER UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION log_inventory_change();
-- Path: {shop_id}/photo.jpg
-- Max size: 5MB
-- Allowed types: image/jpeg, image/png, image/webp
```

### 2. **item-images**
```sql
-- Storage for product/menu item images
-- Path: {shop_id}/{item_id}.jpg
-- Max size: 3MB
-- Allowed types: image/jpeg, image/png, image/webp
```

---

## 🚀 Best Practices for Startup

### Performance Optimization
1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Timestamps**: Always use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
3. **UUID**: Use UUIDs instead of sequential IDs for better security and scalability

### Data Integrity
1. **Constraints**: Use CHECK constraints for status fields
2. **Foreign Keys**: Proper cascading (CASCADE for dependencies, RESTRICT for critical data)
3. **Unique Constraints**: Prevent duplicates (one shop per user, unique order numbers)

### Security
1. **RLS Policies**: Ensure users can only access their own data
2. **Firebase UID**: Never expose Firebase UID in frontend, use it server-side only
3. **Validation**: Validate PAN (10 chars), Aadhaar (12 digits) at DB level

### Scalability
1. **Soft Deletes**: Use `is_active` instead of hard deletes
2. **Timestamps**: Track `created_at` and `updated_at` for audit trails
3. **Normalization**: Proper table relationships for data consistency

---

## 🔄 Database Functions (Optional)

### Auto-update timestamp trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📝 Migration Steps

1. **Create all tables** in order (users → shops → categories → items → orders → order_items → bookings)
2. **Enable RLS** on all tables
3. **Create RLS policies** for each table
4. **Create indexes** for performance
5. **Create storage buckets** for images
6. **Create triggers** for auto-updating timestamps
7. **Test with sample data**

---

## ✅ Checklist

- [ ] All tables created with proper data types
- [ ] Foreign keys and constraints added
- [ ] Indexes created for performance
- [ ] RLS enabled on all tables
- [ ] RLS policies created and tested
- [ ] Storage buckets created
- [ ] Triggers for auto-update timestamps
- [ ] Sample data inserted for testing
- [ ] Frontend integration tested
- [ ] Firebase Auth connected to users table

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Platform**: Supabase PostgreSQL + Firebase Auth
