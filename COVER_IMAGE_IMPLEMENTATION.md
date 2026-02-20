# Shop Image Upload Implementation (CORRECTED)

## Summary
Fixed column name mismatch and implemented shop logo/image upload for registration and profile pages using the correct database column `shop_image_url`.

## Database Schema Reality

The actual `shops` table has:
- ✅ `shop_image_url` (text) - Used for shop logo/image
- ❌ `image_url` - Does NOT exist
- ❌ `shop_photo_url` - Does NOT exist

**Cover image upload is NOT IMPLEMENTED** because the database doesn't have a cover/banner column.

## What Actually Works

### 1. Shop Logo Upload (Registration)
- Users can upload shop logo during registration
- File sent as `image` in FormData
- Stored in `shop_image_url` column
- Uploaded to Cloudinary: `bazarse/shops/shop_{id}_{timestamp}`

### 2. Shop Logo Upload/Update (Profile)
- Both Restaurant and Grocery profiles have clickable avatar button
- Allows updating shop logo through dedicated endpoint `/shop/image`
- Old logo automatically deleted from Cloudinary when replaced

### 3. Cover Upload Button
- Shows "Cover Upload (Coming Soon)" on profile pages
- Button is **disabled** and non-functional
- Requires database schema update to add cover column

## Backend Changes

#### Routes (`backend/src/modules/shop/shop.routes.js`)
- `POST /shop` - accepts `image` field (single file)
- `PATCH /shop` - accepts `image` field (single file)
- `POST /shop/image` - dedicated logo upload endpoint
- `POST /shop/cover` - returns error (not supported)

#### Controller & Service
- All references changed from `image_url` → `shop_image_url`
- Removed non-existent `shop_photo_url` references
- `uploadCoverImage` disabled with error message

## Frontend Changes

- Registration: Sends logo as `image` field in FormData
- Profile pages: Avatar button triggers logo upload
- Profile pages: Cover button disabled with "Coming Soon" text
- Removed all cover upload state and handlers
- Fixed image display to use `shop_image_url` only

## Files Modified

### Backend
- `backend/src/modules/shop/shop.routes.js`
- `backend/src/modules/shop/shop.controller.js`
- `backend/src/modules/shop/shop.service.js`

### Frontend
- `frontend/src/pages/onboarding/Registration.jsx` (already correct)
- `frontend/src/pages/Restaurant/Profile.jsx`
- `frontend/src/pages/Grocery/Profile.jsx`
- `frontend/src/services/shopService.js`

## What Works Now

✅ Shop logo upload during registration  
✅ Shop logo display on profile pages  
✅ Shop logo update via profile avatar button  
✅ Automatic old logo cleanup on Cloudinary  
✅ File validation (JPEG/PNG/WebP, max 5MB)  

## What Doesn't Work (Requires Schema Update)

❌ Cover/banner image upload  
❌ Cover image display on profile pages  

To enable cover upload, database admin needs to add a column like `cover_image_url` or `shop_banner_url` to the `shops` table.
