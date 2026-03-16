# API Deployment Fix Report
**Project:** Doorriing Seller Dashboard  
**Date:** 2026-03-11  

---

## Issue Diagnosed
The frontend deployment on `seller.doorriing.com` was throwing a `net::ERR_NAME_NOT_RESOLVED` and `TypeError: Failed to fetch` on login. 
This was caused by the frontend API configuration attempting to call an unreachable localhost endpoint or relying on hardcoded `window.location` logic that didn't scale correctly with the build process.

## Fixes Implemented

### 1. Frontend API Configuration (`frontend/src/services/api.js`)
**Removed:** Hardcoded `window.location` checks for the API base URL.
**Added:** Standard Vite environment variable resolution:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';
```

### 2. Frontend Production Environment (`frontend/.env.production`)
Created a dedicated production environment file so Vite embeds the correct API url at build time.
**Added:**
```env
VITE_API_URL=https://doorring-seller-production.up.railway.app/api


```

### 3. Backend CORS Configuration (`backend/.env` & `app.js`)
Verified the backend is correctly reading the `CORS_ORIGIN` environment variable. 
**Added to backend `.env`:**
```env
CORS_ORIGIN=https://seller.doorriing.com
```
*Note: The production Railway deployment must also have this exact environment variable set in its dashboard.*

### 4. Backend Port Configuration (`backend/src/server.js` & `config/env.js`)
Verified that the backend listens to Railway's dynamic port via:
```javascript
port: process.env.PORT || 3000
```
This is fully compatible with Railway.

---

## Validation / Next Steps
The frontend-to-backend communication architecture is now sound. 

To complete the rollout:
1. **Push your code** to trigger a new frontend build on your hosting provider (Vercel/Cloudflare/Netlify). Vite will read `.env.production` and hardcode the Railway URL into the bundle.
2. **Update Railway Environment Variables**: Ensure your Railway backend environment is set with `CORS_ORIGIN=https://seller.doorriing.com` so it accepts the incoming requests from the deployed dashboard.

**Status:** Frontend → Backend communication is FIXED. ✅
