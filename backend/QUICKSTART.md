# Quick Start Guide - BazarSe Seller Backend

## 5-Minute Setup

### Step 1: Install Dependencies (30 seconds)
```bash
cd backend
npm install
```

### Step 2: Configure Environment (2 minutes)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
PORT=3000
NODE_ENV=development

# Get from Firebase Console → Project Settings → Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"

# Get from Supabase Dashboard → Project Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional - Frontend URL
CORS_ORIGIN=http://localhost:5173
```

**Important:** Keep the `\n` characters in `FIREBASE_PRIVATE_KEY` - they represent newlines!

### Step 3: Start Server (10 seconds)
```bash
npm run dev
```

You should see:
```
Server running on port 3000
Environment: development
```

### Step 4: Test Health Check (5 seconds)

Open browser or use curl:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-25T10:30:00.000Z"
}
```

✅ **Your backend is running!**

---

## First API Test

### 1. Get Firebase Token

**Frontend (React):**
```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const token = await user.getIdToken();
console.log(token);
```

**Or use Firebase REST API:**
```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@example.com","password":"password123","returnSecureToken":true}'
```

### 2. Bootstrap Seller Account

```bash
curl -X POST http://localhost:3000/api/v1/auth/bootstrap \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firebase_uid": "xxx",
      "email": "seller@example.com",
      "role": "seller"
    },
    "shop": null
  },
  "message": "Success"
}
```

### 3. Create Your First Shop

```bash
curl -X POST http://localhost:3000/api/v1/shop \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "My Grocery Store",
    "owner_name": "John Doe",
    "email": "shop@example.com",
    "phone": "9876543210",
    "category": "Grocery",
    "subcategory": "General",
    "address": "123 Main Street",
    "pan_card": "ABCDE1234F",
    "aadhaar_number": "123456789012",
    "description": "Fresh groceries delivered daily"
  }'
```

### 4. Add a Category

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vegetables",
    "description": "Fresh vegetables"
  }'
```

### 5. Add Your First Item

```bash
curl -X POST http://localhost:3000/api/v1/items \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "CATEGORY_UUID_FROM_STEP_4",
    "name": "Tomatoes",
    "description": "Fresh red tomatoes",
    "price": 50,
    "stock_quantity": 100,
    "unit": "kg",
    "is_available": true
  }'
```

---

## Common Issues

### ❌ "Missing required environment variable"
**Fix:** Check your `.env` file has all required variables filled in

### ❌ "Authentication failed"
**Fix:** Ensure Firebase token is valid and not expired. Regenerate token from frontend.

### ❌ "Seller not found"
**Fix:** Call `/api/v1/auth/bootstrap` first to create seller account

### ❌ "Shop not found for this seller"
**Fix:** Create shop using `POST /api/v1/shop`

### ❌ Database connection errors
**Fix:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

### ❌ CORS errors from frontend
**Fix:** Set `CORS_ORIGIN=http://localhost:5173` in `.env` (match your frontend URL)

---

## Next Steps

1. ✅ Backend running
2. ✅ Shop created
3. 📖 Read full [README.md](README.md)
4. 📖 Review [API documentation](README.md#api-endpoints)
5. 🚀 Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
6. 🧪 Test all endpoints

---

## Useful Development Commands

```bash
# Start with auto-reload
npm run dev

# Start production mode
npm start

# Check for errors (if using ESLint)
npm run lint

# View logs (if using PM2)
pm2 logs bazarse-seller-api
```

---

## Project Structure Overview

```
backend/
├── src/
│   ├── config/          # Firebase, Supabase, environment
│   ├── middlewares/     # Auth, error handling
│   ├── modules/         # Feature modules (auth, shop, items, etc.)
│   ├── routes/          # Route aggregation
│   ├── utils/           # Helpers (cache, validators, errors)
│   ├── app.js           # Express setup
│   └── server.js        # Server start
├── .env                 # Your credentials (NEVER COMMIT!)
├── .env.example         # Template
├── package.json
└── README.md
```

---

## Testing Checklist

- [ ] Health check works: `GET /health`
- [ ] Bootstrap creates user: `POST /api/v1/auth/bootstrap`
- [ ] Profile returns data: `GET /api/v1/auth/profile`
- [ ] Shop creation works: `POST /api/v1/shop`
- [ ] Categories work: `POST /api/v1/categories`
- [ ] Items work: `POST /api/v1/items`
- [ ] Can list items: `GET /api/v1/items`
- [ ] Can update stock: `PATCH /api/v1/items/:id/stock`

---

## Quick Tips

💡 **Always include** `Authorization: Bearer <token>` header  
💡 **Content-Type** must be `application/json`  
💡 **UUIDs** are case-sensitive  
💡 **Stock changes** automatically log to `inventory_logs`  
💡 **One seller** can only have **one shop**  
💡 **Cache** is cleared on updates (shop, categories, etc.)  

---

## Support

- 📖 Full docs: [README.md](README.md)
- 🚀 Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 Issues: Check logs and error messages
- 💬 Questions: Review API endpoint documentation

**Happy coding! 🚀**
