# Files Requiring Modification

**Audit Date**: January 29, 2026  
**Status**: AWAITING SCHEMA RESOLUTION DECISION

---

## ⚠️ CRITICAL NOTICE

**DO NOT APPLY THESE MODIFICATIONS** until schema resolution strategy is determined.

**Two Possible Strategies**:

### Strategy A: Fix Code to Match Schema Reference
- Remove all references to non-existent columns
- Update business logic accordingly
- Safe, no database changes needed
- **Risk**: May break features if schema doc is outdated

### Strategy B: Update Schema Reference Document
- Add missing columns to DATABASE_SCHEMA_REFERENCE.md
- Verify columns exist in actual Supabase database
- No code changes needed
- **Risk**: None if database actually has these columns

**Decision Required From**: Product Owner / Database Administrator

---

## Files with Schema Violations

### 1. `src/modules/auth/auth.service.js`

**Issue**: References 10+ non-existent columns  
**Risk Level**: 🔴 CRITICAL - Will cause production errors  
**Lines Affected**: 7, 14, 28, 31, 47, 59-75

#### Invalid Column References

**In `users` table**:
- `email` (lines 7, 28, 31, 47)

**In `shops` table**:
- `category` (line 14, 59)
- `is_accepting_orders` (lines 14, 70)
- `description` (line 63)
- `email` (line 59)
- `shop_photo_url` (line 68)
- `operating_hours` (line 74)

#### Modification Required (Strategy A)

```javascript
// BEFORE (lines 4-40) - Invalid columns
const bootstrapSeller = async (firebaseUid, email) => {
    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, firebase_uid, email, role') // ❌ email doesn't exist
        .eq('firebase_uid', firebaseUid)
        .single();
    
    if (existingUser) {
        const { data: shop } = await supabase
            .from('shops')
            .select('id, shop_name, category, subcategory, is_open, is_accepting_orders') // ❌ category, is_accepting_orders don't exist
            .eq('seller_id', existingUser.id)
            .single();
        // ...
    }
    
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
            firebase_uid: firebaseUid,
            email: email, // ❌ email doesn't exist
            role: 'seller'
        })
        .select('id, firebase_uid, email, role') // ❌ email doesn't exist
        .single();
    // ...
};

// AFTER (Strategy A) - Schema compliant
const bootstrapSeller = async (firebaseUid) => { // Remove email parameter
    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, firebase_uid, role') // ✅ Only valid columns
        .eq('firebase_uid', firebaseUid)
        .single();
    
    if (existingUser) {
        const { data: shop } = await supabase
            .from('shops')
            .select('id, shop_name, business_type, subcategory, is_open') // ✅ Use business_type, remove is_accepting_orders
            .eq('seller_id', existingUser.id)
            .single();
        // ...
    }
    
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
            firebase_uid: firebaseUid,
            role: 'seller' // ✅ Remove email
        })
        .select('id, firebase_uid, role') // ✅ Only valid columns
        .single();
    // ...
};
```

#### Modification Required (continued)

**getProfile function** (lines 45-77):

```javascript
// BEFORE - Invalid columns
const { data: shop } = await supabase
    .from('shops')
    .select(`
        id,
        shop_name,
        owner_name,
        email,              // ❌ doesn't exist
        phone,
        category,           // ❌ doesn't exist (use business_type)
        subcategory,
        description,        // ❌ doesn't exist
        address,
        city,
        state,
        pincode,
        shop_photo_url,     // ❌ doesn't exist (use shop_image_url)
        is_open,
        is_accepting_orders, // ❌ doesn't exist
        delivery_enabled,
        delivery_charge,
        min_order_amount,
        operating_hours,    // ❌ doesn't exist
        created_at
    `)
    .eq('seller_id', sellerId)
    .single();

// AFTER (Strategy A) - Schema compliant
const { data: shop } = await supabase
    .from('shops')
    .select(`
        id,
        shop_name,
        owner_name,
        phone,
        business_type,      // ✅ Valid (cached name)
        subcategory,        // ✅ Valid
        address,
        city,
        state,
        pincode,
        shop_image_url,     // ✅ Valid (correct column name)
        is_open,            // ✅ Valid
        delivery_enabled,   // ✅ Valid
        delivery_charge,    // ✅ Valid
        min_order_amount,   // ✅ Valid
        created_at          // ✅ Valid
    `)
    .eq('seller_id', sellerId)
    .single();
```

---

### 2. `src/modules/shop/shop.service.js`

**Issue**: References 8+ non-existent columns  
**Risk Level**: 🔴 CRITICAL  
**Lines Affected**: 45, 81-82

#### Invalid Column References

- `description` (line 45, 81)
- `email` (lines 59, 81)
- `website` (line 81)
- `shop_photo_url` (line 82) - Should be `shop_image_url`
- `operating_hours` (line 82)
- Also uses `category` in business logic (line 24, 42)

#### Modification Required (Strategy A)

```javascript
// BEFORE (lines 78-95) - updateShop function
const updateShop = async (sellerId, updates) => {
    const allowedFields = [
        'shop_name', 'description', 'phone', 'email', 'website',  // ❌ Invalid fields
        'address', 'shop_photo_url', 'operating_hours',           // ❌ Invalid fields
        'delivery_enabled', 'delivery_charge', 'min_order_amount'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredUpdates[key] = updates[key];
        }
    });
    
    // ...
};

// AFTER (Strategy A) - Schema compliant
const updateShop = async (sellerId, updates) => {
    const allowedFields = [
        'shop_name', 'phone',                                      // ✅ Valid
        'address', 'city', 'state', 'pincode',                    // ✅ Valid
        'shop_image_url',                                          // ✅ Valid (corrected name)
        'delivery_enabled', 'delivery_charge', 'min_order_amount',// ✅ Valid
        'subcategory'                                              // ✅ Valid
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredUpdates[key] = updates[key];
        }
    });
    
    // ...
};
```

**createShop function** (lines 8-58):

```javascript
// BEFORE - Uses invalid fields
const { data: shop, error } = await supabase
    .from('shops')
    .insert({
        seller_id: sellerId,
        shop_name: shopData.shopName || shopData.shop_name,
        owner_name: shopData.ownerName || shopData.owner_name,
        name: shopData.shopName || shopData.shop_name,
        phone: shopData.phone,
        address: shopData.address,
        city: shopData.city || 'Latehar',
        state: shopData.state || 'Jharkhand',
        pincode: shopData.pincode || shopData.PINCode || '829206',
        business_type: (shopData.category || shopData.business_type)?.toLowerCase(), // ✅ Valid
        business_type_id: businessTypeId,
        subcategory: shopData.subcategory,        // ✅ Valid
        description: shopData.description || '',  // ❌ Invalid
        shop_image_url: null,                     // ✅ Valid (correct name)
        delivery_enabled: true,
        delivery_charge: 0,
        min_order_amount: 0,
        is_open: true,
        is_active: true,
        is_verified: false
    })
    .select()
    .single();

// AFTER (Strategy A) - Remove description
const { data: shop, error } = await supabase
    .from('shops')
    .insert({
        seller_id: sellerId,
        shop_name: shopData.shopName || shopData.shop_name,
        owner_name: shopData.ownerName || shopData.owner_name,
        name: shopData.shopName || shopData.shop_name,
        phone: shopData.phone,
        address: shopData.address,
        city: shopData.city || 'Latehar',
        state: shopData.state || 'Jharkhand',
        pincode: shopData.pincode || shopData.PINCode || '829206',
        business_type: (shopData.category || shopData.business_type)?.toLowerCase(),
        business_type_id: businessTypeId,
        subcategory: shopData.subcategory,
        // description removed - column doesn't exist
        shop_image_url: null,
        delivery_enabled: true,
        delivery_charge: 0,
        min_order_amount: 0,
        is_open: true,
        is_active: true,
        is_verified: false
    })
    .select()
    .single();
```

---

### 3. `src/modules/discount/discount.service.js`

**Issue**: ENTIRE discount system uses non-existent schema  
**Risk Level**: 🔴 CRITICAL - Complete module incompatibility  
**Lines Affected**: Entire file

#### Invalid Column References (9+ columns)

Schema defines discounts as:
- `id`, `shop_id`, `category_id`, `item_id`
- `discount_type`, `discount_value`
- `start_at`, `end_at`
- `is_active`, `created_at`, `updated_at`, `deleted_at`

Code uses:
- `code` ❌
- `name` ❌
- `description` ❌
- `min_order_amount` ❌
- `max_discount_amount` ❌
- `usage_limit` ❌
- `usage_per_customer` ❌
- `valid_from` ❌ (should be `start_at`)
- `valid_until` ❌ (should be `end_at`)

#### Decision Required

**Option 1**: Update code to match simple discount model
- Remove coupon code system
- Use only category/item-based discounts
- Remove usage tracking

**Option 2**: Update database schema
- Add missing columns via migration
- Keep existing coupon functionality
- Requires DB migration

**⚠️ CRITICAL**: This requires business logic decision, not just technical fix.

#### Modification Required (Strategy A - Simplified)

```javascript
// BEFORE - Coupon-based system
const createDiscount = async (shopId, discountData) => {
    const { data: existing } = await supabase
        .from('discounts')
        .select('id')
        .eq('shop_id', shopId)
        .eq('code', discountData.code) // ❌ 'code' doesn't exist
        .single();
    
    if (existing) {
        throw new ConflictError('Discount code already exists');
    }
    
    const { data, error } = await supabase
        .from('discounts')
        .insert({
            shop_id: shopId,
            code: discountData.code.toUpperCase(),              // ❌
            name: discountData.name,                            // ❌
            description: discountData.description,              // ❌
            discount_type: discountData.discount_type,          // ✅
            discount_value: discountData.discount_value,        // ✅
            min_order_amount: discountData.min_order_amount,    // ❌
            max_discount_amount: discountData.max_discount_amount, // ❌
            usage_limit: discountData.usage_limit,              // ❌
            usage_per_customer: discountData.usage_per_customer,// ❌
            valid_from: discountData.valid_from,                // ❌ (should be start_at)
            valid_until: discountData.valid_until,              // ❌ (should be end_at)
            is_active: discountData.is_active !== undefined ? discountData.is_active : true
        })
        .select()
        .single();
    // ...
};

// AFTER (Strategy A) - Simple discount system
const createDiscount = async (shopId, discountData) => {
    // Remove duplicate check (no 'code' field exists)
    
    const { data, error } = await supabase
        .from('discounts')
        .insert({
            shop_id: shopId,
            category_id: discountData.category_id || null,  // ✅ Apply to category
            item_id: discountData.item_id || null,          // ✅ Apply to specific item
            discount_type: discountData.discount_type,      // ✅ 'flat' or 'percent'
            discount_value: discountData.discount_value,    // ✅ Value
            start_at: discountData.start_at,                // ✅ Correct column name
            end_at: discountData.end_at,                    // ✅ Correct column name
            is_active: discountData.is_active !== undefined ? discountData.is_active : true
        })
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};
```

**⚠️ WARNING**: This changes business logic significantly. Requires PM approval.

---

### 4. `src/modules/review/review.service.js`

**Issue**: Uses seller response feature not in schema  
**Risk Level**: 🟡 MEDIUM  
**Lines Affected**: 43-53

#### Invalid Column References

- `seller_response` (line 45)
- `responded_at` (line 46)

#### Modification Required (Strategy A)

```javascript
// BEFORE - respondToReview function (lines 43-53)
const respondToReview = async (reviewId, shopId, sellerResponse) => {
    const { data, error } = await supabase
        .from('reviews')
        .update({
            seller_response: sellerResponse,    // ❌ Column doesn't exist
            responded_at: new Date().toISOString() // ❌ Column doesn't exist
        })
        .eq('id', reviewId)
        .eq('shop_id', shopId)
        .select()
        .single();
    
    if (error) throw error;
    
    return data;
};

// AFTER (Strategy A) - Remove function entirely
// DELETE respondToReview function
// Also remove from review.controller.js and review.routes.js

// OR keep function but make it a no-op:
const respondToReview = async (reviewId, shopId, sellerResponse) => {
    // Feature not supported - schema doesn't have seller_response columns
    // Return the review unchanged
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .eq('shop_id', shopId)
        .single();
    
    if (error) throw error;
    
    return data;
};
```

**Impact**: Seller response feature will be disabled unless schema is updated.

---

### 5. `src/modules/notification/notification.service.js`

**Issue**: Uses `read_at` timestamp not in schema  
**Risk Level**: 🟢 LOW  
**Lines Affected**: 22, 39

#### Invalid Column References

- `read_at` (lines 22, 39)

Schema has: `is_read` (boolean), `created_at` (timestamp)  
Code tries to add: `read_at` (timestamp)

#### Modification Required (Strategy A)

```javascript
// BEFORE (lines 18-26)
const markAsRead = async (notificationId, shopId) => {
    const { data, error } = await supabase
        .from('notifications')
        .update({
            is_read: true,                         // ✅ Valid
            read_at: new Date().toISOString()     // ❌ Column doesn't exist
        })
        .eq('id', notificationId)
        .eq('shop_id', shopId)
        .select()
        .single();
    // ...
};

// AFTER (Strategy A) - Remove read_at
const markAsRead = async (notificationId, shopId) => {
    const { data, error } = await supabase
        .from('notifications')
        .update({
            is_read: true  // ✅ Only set boolean flag
        })
        .eq('id', notificationId)
        .eq('shop_id', shopId)
        .select()
        .single();
    // ...
};
```

**Same fix for markAllAsRead** (lines 35-44):

```javascript
// BEFORE
const markAllAsRead = async (shopId) => {
    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()  // ❌ Remove this
        })
        .eq('shop_id', shopId)
        .eq('is_read', false);
    // ...
};

// AFTER
const markAllAsRead = async (shopId) => {
    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true  // ✅ Only this
        })
        .eq('shop_id', shopId)
        .eq('is_read', false);
    // ...
};
```

---

### 6. `src/modules/grocery/grocery.service.js`

**Issue**: Uses `description` field inconsistent with item.service.js  
**Risk Level**: 🟡 MEDIUM  
**Lines Affected**: 21, 115

#### Invalid Column Reference

- `description` (already removed from `item.service.js` but still in `grocery.service.js`)

#### Modification Required (Strategy A)

```javascript
// BEFORE (line 17-25)
const buildItemPayload = (shopId, data) => {
    const payload = {
        shop_id: shopId,
        name: data.name,
        description: data.description || null,  // ❌ Column doesn't exist
        price: data.price,
        half_portion_price: data.half_portion_price || null,
        stock_quantity: data.stock_quantity || 0,
        unit: data.unit || null,
        image_url: data.image_url || null,
        is_available: data.is_available !== undefined ? data.is_available : true,
    };
    // ...
};

// AFTER (Strategy A) - Remove description
const buildItemPayload = (shopId, data) => {
    const payload = {
        shop_id: shopId,
        name: data.name,
        // description removed - column doesn't exist in schema
        price: data.price,
        half_portion_price: data.half_portion_price || null,
        stock_quantity: data.stock_quantity || 0,
        unit: data.unit || null,
        image_url: data.image_url || null,
        is_available: data.is_available !== undefined ? data.is_available : true,
    };
    // ...
};
```

**Also update allowedFields array** (line 111-117):

```javascript
// BEFORE
const allowedFields = [
    'name', 'description', 'price', 'half_portion_price',  // ❌ description invalid
    'stock_quantity', 'unit', 'image_url', 'is_available', 'category_id'
];

// AFTER
const allowedFields = [
    'name', 'price', 'half_portion_price',  // ✅ description removed
    'stock_quantity', 'unit', 'image_url', 'is_available', 'category_id'
];
```

---

## Summary of Modifications

| File | Invalid Columns | Fix Complexity | Business Impact |
|------|-----------------|----------------|-----------------|
| auth.service.js | 10+ | MEDIUM | Email functionality removed |
| shop.service.js | 8+ | MEDIUM | Shop metadata features removed |
| discount.service.js | 9+ | HIGH | Coupon system completely changed |
| review.service.js | 2 | LOW | Seller responses disabled |
| notification.service.js | 1 | LOW | Timestamp tracking simplified |
| grocery.service.js | 1 | LOW | Description field removed |

**Total Columns to Fix**: 31+

---

## Testing Required After Modifications

1. ✅ Unit test all service functions
2. ✅ Integration test all API endpoints
3. ✅ Verify no Supabase query errors in logs
4. ✅ Test frontend compatibility (API contract changes)
5. ✅ Regression test existing features

---

## Rollout Plan (If Strategy A Chosen)

1. **Phase 1**: Low-risk fixes (notification.service.js, grocery.service.js)
2. **Phase 2**: Medium-risk fixes (auth.service.js, shop.service.js, review.service.js)
3. **Phase 3**: High-risk fix (discount.service.js) - Requires business logic redesign
4. **Phase 4**: Update frontend to match new API contracts
5. **Phase 5**: Deploy and monitor

---

**NEXT STEP**: Decide Schema Resolution Strategy (A or B) before proceeding.
