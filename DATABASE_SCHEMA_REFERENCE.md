# Bazarse – Database Schema Reference

This document lists **all database tables, columns, data types, and intent** for the Bazarse backend.
Use this as a **single source of truth** for backend, frontend, and AI agents working on the codebase.

---

## 1. shops

Represents a seller shop (restaurant / grocery).

| Column           | Type        | Nullable | Notes                      |
| ---------------- | ----------- | -------- | -------------------------- |
| id               | uuid        | ❌        | Primary key                |
| seller_id        | uuid        | ❌        | User who owns the shop     |
| name             | text        | ❌        | Internal name              |
| shop_name        | text        | ❌        | Display name               |
| owner_name       | text        | ❌        | Owner name                 |
| phone            | text        | ❌        | Contact number             |
| address          | text        | ❌        | Full address               |
| city             | text        | ❌        | City                       |
| state            | text        | ❌        | State                      |
| pincode          | text        | ❌        | Pincode                    |
| subcategory      | text        | ✅        | Shop subcategory           |
| business_type_id | uuid        | ❌        | FK → business_types        |
| business_type    | varchar     | ❌        | Cached name                |
| shop_image_url   | text        | ✅        | Image URL                  |
| status           | text        | ❌        | pending / active / blocked |
| closed_reason    | text        | ✅        | Reason if closed           |
| is_active        | boolean     | ❌        | Soft active flag           |
| is_open          | boolean     | ❌        | Open/closed toggle         |
| is_verified      | boolean     | ❌        | Admin verified             |
| delivery_enabled | boolean     | ❌        | Delivery on/off            |
| delivery_charge  | numeric     | ✅        | Delivery fee               |
| min_order_amount | numeric     | ✅        | Minimum order              |
| created_at       | timestamptz | ❌        | Created time               |
| updated_at       | timestamptz | ✅        | Updated time               |
| deleted_at       | timestamptz | ✅        | Soft delete                |

---

## 2. users

Application users (seller/admin/customer mapping).

| Column       | Type        | Nullable | Notes                     |
| ------------ | ----------- | -------- | ------------------------- |
| id           | uuid        | ❌        | Primary key               |
| firebase_uid | text        | ❌        | Firebase auth UID         |
| role         | text        | ❌        | admin / seller / customer |
| created_at   | timestamptz | ❌        | Created time              |
| updated_at   | timestamptz | ✅        | Updated time              |

---

## 3. business_types

Defines shop types (restaurant, grocery, pharmacy, etc).

| Column     | Type        | Nullable | Notes              |
| ---------- | ----------- | -------- | ------------------ |
| id         | uuid        | ❌        | Primary key        |
| name       | text        | ❌        | Business type name |
| created_at | timestamptz | ❌        | Created time       |

---

## 4. categories

Product/menu categories.

| Column        | Type        | Nullable | Notes          |
| ------------- | ----------- | -------- | -------------- |
| id            | uuid        | ❌        | Primary key    |
| shop_id       | uuid        | ❌        | FK → shops     |
| name          | text        | ❌        | Category name  |
| sort_order    | int         | ✅        | Ordering       |
| display_order | int         | ✅        | UI order       |
| parent_id     | uuid        | ✅        | Self reference |
| is_active     | boolean     | ❌        | Active flag    |
| created_at    | timestamptz | ❌        | Created time   |
| updated_at    | timestamptz | ✅        | Updated time   |
| deleted_at    | timestamptz | ✅        | Soft delete    |

---

## 5. items

Products / menu items (restaurant + grocery unified).

| Column             | Type        | Nullable | Notes              |
| ------------------ | ----------- | -------- | ------------------ |
| id                 | uuid        | ❌        | Primary key        |
| shop_id            | uuid        | ❌        | FK → shops         |
| category_id        | uuid        | ❌        | FK → categories    |
| name               | text        | ❌        | Item name          |
| description        | text        | ✅        | Description        |
| image_url          | text        | ✅        | Image URL          |
| unit               | text        | ✅        | kg / piece / plate |
| price              | numeric     | ❌        | Base price         |
| full_price         | numeric     | ✅        | Restaurant full    |
| half_portion_price | numeric     | ✅        | Restaurant half    |
| is_available       | boolean     | ❌        | Availability       |
| is_active          | boolean     | ❌        | Active flag        |
| track_stock        | boolean     | ❌        | Inventory flag     |
| stock              | int         | ✅        | Stock              |
| stock_quantity     | int         | ✅        | Current stock      |
| has_variants       | boolean     | ❌        | Variant support    |
| sku                | text        | ✅        | SKU code           |
| expiry_date        | date        | ✅        | Grocery expiry     |
| created_at         | timestamptz | ❌        | Created time       |
| updated_at         | timestamptz | ✅        | Updated time       |
| deleted_at         | timestamptz | ✅        | Soft delete        |

---

## 6. inventory_logs

Tracks inventory changes.

| Column          | Type        | Nullable | Notes          |
| --------------- | ----------- | -------- | -------------- |
| id              | uuid        | ❌        | Primary key    |
| shop_id         | uuid        | ❌        | FK → shops     |
| item_id         | uuid        | ❌        | FK → items     |
| change_type     | text        | ❌        | sale / restock |
| quantity_before | int         | ❌        | Before         |
| quantity_change | int         | ❌        | Delta          |
| quantity_after  | int         | ❌        | After          |
| notes           | text        | ✅        | Notes          |
| created_at      | timestamptz | ❌        | Created time   |

---

## 7. orders

Customer orders.

| Column              | Type        | Nullable | Notes                          |
| ------------------- | ----------- | -------- | ------------------------------ |
| id                  | uuid        | ❌        | Primary key                    |
| shop_id             | uuid        | ❌        | FK → shops                     |
| order_number        | text        | ❌        | Human readable ID              |
| customer_name       | text        | ❌        | Customer                       |
| customer_phone      | text        | ❌        | Phone                          |
| delivery_address    | text        | ❌        | Address                        |
| items_total         | numeric     | ❌        | Items sum                      |
| delivery_charge     | numeric     | ❌        | Delivery fee                   |
| total_amount        | numeric     | ❌        | Final amount                   |
| payment_method      | text        | ❌        | COD / UPI                      |
| payment_status      | text        | ❌        | pending / paid                 |
| status              | text        | ❌        | placed / confirmed / delivered |
| customer_notes      | text        | ✅        | Notes                          |
| cancellation_reason | text        | ✅        | Cancel reason                  |
| confirmed_at        | timestamptz | ✅        | Confirmed                      |
| delivered_at        | timestamptz | ✅        | Delivered                      |
| cancelled_at        | timestamptz | ✅        | Cancelled                      |
| created_at          | timestamptz | ❌        | Created time                   |
| updated_at          | timestamptz | ✅        | Updated time                   |

---

## 8. order_items

Items inside an order.

| Column     | Type        | Nullable | Notes         |
| ---------- | ----------- | -------- | ------------- |
| id         | uuid        | ❌        | Primary key   |
| order_id   | uuid        | ❌        | FK → orders   |
| item_id    | uuid        | ❌        | FK → items    |
| item_name  | text        | ❌        | Snapshot name |
| item_price | numeric     | ❌        | Price         |
| quantity   | int         | ❌        | Quantity      |
| unit       | text        | ✅        | Unit          |
| subtotal   | numeric     | ❌        | price × qty   |
| created_at | timestamptz | ❌        | Created time  |

---

## 9. discounts

Discount definitions.

| Column         | Type        | Nullable | Notes           |
| -------------- | ----------- | -------- | --------------- |
| id             | uuid        | ❌        | Primary key     |
| shop_id        | uuid        | ❌        | FK → shops      |
| category_id    | uuid        | ✅        | FK → categories |
| item_id        | uuid        | ✅        | FK → items      |
| discount_type  | text        | ❌        | flat / percent  |
| discount_value | numeric     | ❌        | Value           |
| start_at       | timestamptz | ❌        | Start           |
| end_at         | timestamptz | ❌        | End             |
| is_active      | boolean     | ❌        | Active flag     |
| created_at     | timestamptz | ❌        | Created time    |
| updated_at     | timestamptz | ✅        | Updated time    |
| deleted_at     | timestamptz | ✅        | Soft delete     |

---

## 10. discount_usage

Tracks applied discounts.

| Column      | Type        | Nullable | Notes          |
| ----------- | ----------- | -------- | -------------- |
| id          | uuid        | ❌        | Primary key    |
| discount_id | uuid        | ❌        | FK → discounts |
| order_id    | uuid        | ❌        | FK → orders    |
| used_at     | timestamptz | ❌        | Usage time     |

---

## 11. reviews

Customer reviews.

| Column        | Type        | Nullable | Notes        |
| ------------- | ----------- | -------- | ------------ |
| id            | uuid        | ❌        | Primary key  |
| shop_id       | uuid        | ❌        | FK → shops   |
| customer_name | text        | ✅        | Name         |
| rating        | int         | ❌        | 1–5          |
| comment       | text        | ✅        | Review       |
| is_visible    | boolean     | ❌        | Moderation   |
| created_at    | timestamptz | ❌        | Created time |

---

## 12. notifications

System notifications.

| Column       | Type        | Nullable | Notes          |
| ------------ | ----------- | -------- | -------------- |
| id           | uuid        | ❌        | Primary key    |
| shop_id      | uuid        | ❌        | FK → shops     |
| title        | text        | ❌        | Title          |
| message      | text        | ❌        | Message        |
| type         | text        | ❌        | order / system |
| reference_id | uuid        | ✅        | Linked entity  |
| is_read      | boolean     | ❌        | Read flag      |
| created_at   | timestamptz | ❌        | Created time   |

---

## 13. analytics_daily

Daily analytics snapshot.

| Column              | Type        | Nullable | Notes        |
| ------------------- | ----------- | -------- | ------------ |
| id                  | uuid        | ❌        | Primary key  |
| shop_id             | uuid        | ❌        | FK → shops   |
| date                | date        | ❌        | Day          |
| total_orders        | int         | ✅        | Orders       |
| completed_orders    | int         | ✅        | Delivered    |
| total_revenue       | numeric     | ✅        | Revenue      |
| average_order_value | numeric     | ✅        | AOV          |
| created_at          | timestamptz | ❌        | Created time |

---

## 14. bookings (restaurant only)

Table reservations.

| Column           | Type        | Nullable | Notes               |
| ---------------- | ----------- | -------- | ------------------- |
| id               | uuid        | ❌        | Primary key         |
| shop_id          | uuid        | ❌        | FK → shops          |
| customer_name    | text        | ❌        | Name                |
| customer_phone   | text        | ❌        | Phone               |
| number_of_guests | int         | ❌        | Guests              |
| booking_date     | date        | ❌        | Date                |
| booking_time     | time        | ❌        | Time                |
| status           | text        | ❌        | pending / confirmed |
| created_at       | timestamptz | ❌        | Created time        |
| updated_at       | timestamptz | ✅        | Updated time        |

---

## Table Relationships

### Primary Foreign Keys
- `shops.seller_id` → `users.id`
- `shops.business_type_id` → `business_types.id`
- `categories.shop_id` → `shops.id`
- `categories.parent_id` → `categories.id` (self-reference)
- `items.shop_id` → `shops.id`
- `items.category_id` → `categories.id`
- `inventory_logs.shop_id` → `shops.id`
- `inventory_logs.item_id` → `items.id`
- `orders.shop_id` → `shops.id`
- `order_items.order_id` → `orders.id`
- `order_items.item_id` → `items.id`
- `discounts.shop_id` → `shops.id`
- `discounts.category_id` → `categories.id`
- `discounts.item_id` → `items.id`
- `discount_usage.discount_id` → `discounts.id`
- `discount_usage.order_id` → `orders.id`
- `reviews.shop_id` → `shops.id`
- `notifications.shop_id` → `shops.id`
- `analytics_daily.shop_id` → `shops.id`
- `bookings.shop_id` → `shops.id`

---

## Important Notes

### Design Principles
- **Unified Schema**: Same schema supports both grocery and restaurant business types
- **Soft Deletes**: Always use `deleted_at` timestamp instead of hard deletes
- **Column Consistency**: Backend queries must match column names exactly as defined
- **No Duplicate Tables**: Avoid creating separate tables for similar functionality

### Data Types
- `uuid`: PostgreSQL UUID type for all IDs
- `text`: Variable-length text without limit
- `varchar`: Variable-length with limit (rarely used)
- `numeric`: Arbitrary precision numbers for money
- `int`: 4-byte integer
- `boolean`: True/false values
- `timestamptz`: Timestamp with timezone
- `date`: Date without time
- `time`: Time without date

### Common Patterns
- All tables have `created_at` (required)
- Most tables have `updated_at` (nullable)
- Soft-deletable tables have `deleted_at` (nullable)
- Active flags use `is_active` boolean
- Status fields use lowercase text values

---

## Usage Guidelines

### For Backend Developers
- Always reference this document when writing queries
- Use exact column names (case-sensitive in quotes if needed)
- Respect nullable constraints when inserting data
- Implement soft deletes using `deleted_at`
- Always filter by `deleted_at IS NULL` in queries

### For Frontend Developers
- Match API responses to these column names
- Handle nullable fields appropriately in UI
- Display status values consistently
- Respect foreign key relationships when creating/updating data

### For AI Agents
- This is the single source of truth for database structure
- Do not create duplicate or conflicting tables
- When generating code, use exact column names
- Follow the established patterns for new features
- Validate all database operations against this schema

---

*Last Updated: January 29, 2026*
