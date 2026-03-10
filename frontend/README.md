# BazarSe Seller Web App

## Overview
The **BazarSe Seller Web App** is a dedicated dashboard for marketplace sellers to manage their operations on the BazarSe platform. It provides a cohesive, unified experience for both restaurant and grocery vendors to track everything from live orders to withdrawal requests, ensuring merchants have total control over their storefront.

## Features
- **Dashboard:** Centralized home for tracking daily revenue, active orders, and live analytics.
- **Product & Menu Management:** Add, edit, and organize restaurant menus or grocery products entirely across categories and subcategories.
- **Order Management:** View and update the status of incoming orders (Pending, Confirmed, Preparing, Delivered, etc.).
- **Bookings Setup:** Easily toggle in-store reservations and manage customer table bookings.
- **Offers:** Apply and oversee specific product discounts and special promotional prices (coming soon!).
- **Reports & Analytics:** Deep dive into sales trends, top-performing items, and order volume breakdowns using visual charts.
- **Wallet & Payouts:** Track total lifetime earnings, current pending balances, and safely request wallet withdrawals.

## Setup Instructions
1. **Prerequisites:** Ensure you have Node.js (v18+) and npm installed on your machine.
2. **Environment Variables:** Create a `.env` file based on `.env.example` in the root directory (specifying `VITE_API_BASE_URL` and Firebase keys).
3. **Install Dependencies:** Navigate to the `frontend` root folder and run:
   ```bash
   npm install
   ```

## Development Commands
- **Start Development Server:**
  Run the app in development mode with HMR processing.
  ```bash
  npm run dev
  ```
- **Build for Production:**
  Build and optimize all assets into the `dist/` directory perfectly optimized for web deployment.
  ```bash
  npm run build
  ```
- **Preview Production Build:**
  Locally preview the generated distribution files.
  ```bash
  npm run preview
  ```
