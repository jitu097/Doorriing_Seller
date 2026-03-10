# Terms & Conditions Consent — Implementation Report

**Date:** 2026-03-11  
**Feature:** Mandatory T&C acceptance for new seller registration  
**Project:** Doorriing Seller Platform

---

## Files Modified / Created

| File | Action | Description |
|---|---|---|
| `frontend/src/pages/legal/TermsAndConditions.jsx` | **NEW** | Public T&C page with 11 sections |
| `frontend/src/pages/legal/TermsAndConditions.css` | **NEW** | Styles for the T&C page |
| `frontend/src/routes/index.jsx` | Modified | Added lazy import + `/terms-and-conditions` public route |
| `frontend/src/pages/onboarding/Registration.jsx` | Modified | T&C checkbox, `termsAccepted` state, button disabled logic, FormData field |
| `frontend/src/pages/onboarding/Registration.css` | Modified | Checkbox section styles, disabled button variant |
| `backend/src/modules/shop/shop.controller.js` | Modified | HTTP 400 rejection if `termsAccepted !== true` |
| `backend/src/modules/shop/shop.service.js` | Modified | Stores `terms_accepted`, `terms_accepted_at`, `terms_version` in Supabase |
| `migrations/terms_consent_columns.sql` | **NEW** | Safe `ALTER TABLE` with `IF NOT EXISTS` for existing shops |

---

## Database Migration

> [!IMPORTANT]
> Run `migrations/terms_consent_columns.sql` in Supabase SQL Editor to add the 3 columns.

```sql
ALTER TABLE shops
    ADD COLUMN IF NOT EXISTS terms_accepted     BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS terms_version      TEXT        DEFAULT 'v1';
```

**Existing shops:** All three columns have safe defaults (`FALSE`, `NULL`, `'v1'`). No rows are modified — existing sellers are completely unaffected.

---

## Frontend Validation

**Registration.jsx:**
- `termsAccepted` state (default `false`)
- Checkbox above the action buttons: _"I agree to the Terms & Conditions"_ (link opens `/terms-and-conditions` in a new tab)
- Register button disabled while `!termsAccepted`
- Guard in `handleSubmit` that calls `alert` and aborts if unchecked
- `termsAccepted: 'true'` and `terms_version: 'v1'` appended to the `FormData` payload

---

## Backend Validation

**shop.controller.js:**
```js
const termsAccepted = req.body.termsAccepted === 'true' || req.body.termsAccepted === true;
if (!termsAccepted) {
    throw new BadRequestError('You must accept the Terms & Conditions to register your shop.');
}
```
Returns **HTTP 400** with a clear message if called without consent.

**shop.service.js — Supabase insert:**
```js
terms_accepted:    true,
terms_accepted_at: new Date().toISOString(),
terms_version:     shopData.terms_version || 'v1'
```

---

## Public Route

`/terms-and-conditions` — accessible without authentication. 11-section T&C document covering eligibility, responsibilities, payments, data, commission, and governing law.

---

## Existing Sellers — Safety

| Concern | Status |
|---|---|
| Existing shop rows | ✅ Unaffected — columns default to `FALSE` / `NULL` |
| Login flow | ✅ Unchanged |
| Token validation / RLS | ✅ Unchanged |
| API endpoints | ✅ Unchanged |
| T&C validation only runs on `POST /api/seller/shop` (create) — not on update/login | ✅ |
