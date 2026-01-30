# Files Identified for Removal

**Audit Date**: January 29, 2026  
**Risk Assessment**: Conservative (Only provably safe deletions)

---

## ✅ Safe to Delete (2 files)

These files are standalone utilities never imported by production code. Safe for immediate deletion.

### 1. Test/Debug Utilities

| File Path | Size | Purpose | Last Used | Safe to Delete |
|-----------|------|---------|-----------|----------------|
| `backend/check_buckets.js` | ~60 lines | Debug script to decode and inspect Supabase JWT tokens | Development only | ✅ YES |
| `backend/create_bucket.js` | ~33 lines | One-time setup script to create 'menu-items' storage bucket | One-time setup | ✅ YES |

**Verification Method**:
- Grepped entire codebase for `require('./check_buckets')` - **0 matches**
- Grepped entire codebase for `require('./create_bucket')` - **0 matches**
- Not referenced in package.json scripts
- Not used in any module, middleware, or config file

**Deletion Impact**: NONE - These are standalone scripts for manual execution only.

**Recommendation**: DELETE immediately to reduce codebase clutter.

---

## ❌ Cannot Delete Without Further Review

### Core Module Files (ALL IN USE)

All files in `src/modules/*/` are actively registered in the route system:

```javascript
// From src/routes/index.js - ALL MODULES LOADED
router.use('/auth', authRoutes);
router.use('/shop', shopRoutes);
router.use('/categories', categoryRoutes);
router.use('/items', itemRoutes);
router.use('/grocery', groceryRoutes);
router.use('/orders', orderRoutes);
router.use('/discounts', discountRoutes);
router.use('/reviews', reviewRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
```

**Files**: 33 files (11 modules × 3 files each: controller, service, routes)  
**Status**: ❌ ALL IN USE - Cannot delete

---

### Middleware Files (ALL IN USE)

| File | Used By | Status |
|------|---------|--------|
| `src/middlewares/error.middleware.js` | app.js (global error handler) | ❌ IN USE |
| `src/middlewares/auth.middleware.js` | Protected routes across all modules | ❌ IN USE |
| `src/middlewares/seller.middleware.js` | Shop ownership verification | ❌ IN USE |
| `src/middlewares/upload.middleware.js` | Image upload endpoints | ❌ IN USE |

**Status**: ❌ ALL IN USE - Cannot delete

---

### Configuration Files (ALL IN USE)

| File | Purpose | Status |
|------|---------|--------|
| `src/config/env.js` | Environment variable management | ❌ IN USE |
| `src/config/firebaseAdmin.js` | Firebase Admin SDK init | ❌ IN USE |
| `src/config/supabaseClient.js` | Supabase client init | ❌ IN USE |

**Status**: ❌ ALL IN USE - Cannot delete

---

### Utility Files (ALL IN USE)

| File | Used By | Status |
|------|---------|--------|
| `src/utils/cache.js` | auth.service.js, shop.service.js | ❌ IN USE |
| `src/utils/errors.js` | Multiple service files | ❌ IN USE |
| `src/utils/response.js` | Controllers (likely) | ❌ ASSUMED IN USE |
| `src/utils/validators.js` | booking.service.js, order.service.js, review.service.js | ❌ IN USE |

**Status**: ❌ ALL IN USE - Cannot delete

---

### Documentation Files (Keep for Reference)

| File | Purpose | Action |
|------|---------|--------|
| `README.md` | Project documentation | KEEP |
| `DEPLOYMENT.md` | Deployment guide | KEEP |
| `QUICKSTART.md` | Quick start guide | KEEP |
| `REVIEW.md` | Code review notes | KEEP (or archive) |
| `.env.example` | Environment template | KEEP |

---

## Summary Statistics

| Category | Count | Action |
|----------|-------|--------|
| **Safe Deletions** | 2 | DELETE |
| **Production Code** | 43+ | KEEP |
| **Documentation** | 5 | KEEP |
| **Total Files Analyzed** | 50+ | - |

---

## Deletion Commands (Execute After Approval)

```powershell
# Navigate to backend directory
cd c:\Users\jk309\OneDrive\Desktop\BazarSe_Seller\backend

# Safe deletions
Remove-Item check_buckets.js
Remove-Item create_bucket.js

# Verify deletion
Get-ChildItem -File | Where-Object { $_.Name -like '*bucket*' }
# Should return: No matches
```

---

## What About Schema-Invalid Code?

**Question**: Why not delete code referencing non-existent columns?

**Answer**: **REQUIRES REVIEW FIRST**

The schema violations found (23+ invalid column references) fall into two scenarios:

### Scenario A: Schema is Outdated
- Database actually HAS these columns
- Schema documentation is incomplete
- Deleting code would break production

### Scenario B: Code is Wrong
- Database truly lacks these columns
- Code will fail in production
- Code must be fixed (not just deleted)

**Action Required**: 
1. Inspect actual database schema in Supabase
2. Compare with DATABASE_SCHEMA_REFERENCE.md
3. Update either code OR schema documentation
4. Then modify/remove invalid references

**Do NOT blindly delete until schema truth is established.**

---

## Files Requiring Modification (Not Deletion)

These files need **code changes**, not deletion:

| File | Issue | Action |
|------|-------|--------|
| `src/modules/auth/auth.service.js` | Uses non-schema columns | FIX or UPDATE SCHEMA |
| `src/modules/shop/shop.service.js` | Uses non-schema columns | FIX or UPDATE SCHEMA |
| `src/modules/discount/discount.service.js` | Entire structure mismatch | FIX or UPDATE SCHEMA |
| `src/modules/review/review.service.js` | Uses non-schema columns | FIX or UPDATE SCHEMA |
| `src/modules/notification/notification.service.js` | Uses non-schema column | FIX or UPDATE SCHEMA |
| `src/modules/grocery/grocery.service.js` | Uses `description` field | REMOVE or UPDATE SCHEMA |

See CLEANUP_SUMMARY.md for detailed analysis.

---

## Recommended Workflow

1. ✅ **DELETE** test utilities (check_buckets.js, create_bucket.js) - **SAFE NOW**
2. ⏸️ **PAUSE** - Determine schema resolution strategy
3. 🔧 **FIX** schema violations based on chosen strategy
4. 🧹 **CLEAN** commented code after schema finalized
5. ✅ **VALIDATE** all changes against actual database

---

**Status**: Ready to delete 2 files. All other cleanup requires schema resolution decision.
