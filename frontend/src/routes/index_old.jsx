import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import Loader from '../components/common/Loader';

// Lazy load pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const Registration = lazy(() => import('../pages/onboarding/Registration'));
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));

// Grocery Pages
const GroceryDashboard = lazy(() => import('../pages/Grocery/DAshboard'));
const GroceryProducts = lazy(() => import('../pages/Grocery/Products'));
const GroceryOrders = lazy(() => import('../pages/Grocery/Orders'));

// Restaurant Pages
const RestaurantDashboard = lazy(() => import('../pages/Restaurant/Dashboard'));
const RestaurantMenu = lazy(() => import('../pages/Restaurant/Menu'));
const RestaurantOrders = lazy(() => import('../pages/Restaurant/Orders'));
const RestaurantBooking = lazy(() => import('../pages/Restaurant/Booking'));
const RestaurantOffers = lazy(() => import('../pages/Restaurant/offers'));
const RestaurantReports = lazy(() => import('../pages/Restaurant/Reports'));
const RestaurantProfile = lazy(() => import('../pages/Restaurant/Profile'));

// --- Route Guards (Consolidated) ---

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    if (isAuthenticated === null) return <Loader variant="fullscreen" message="Loading..." />;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    if (isAuthenticated === null) return <Loader variant="fullscreen" message="Loading..." />;
    
    // Allow access to login/register pages even if logged in
    return isAuthenticated ? <Outlet /> : <Outlet />;
};

// --- Main Routes ---

const AppRoutes = () => {
    return (
        <Suspense fallback={<Loader variant="fullscreen" message="Loading App..." />}>
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Public Routes (Login, Register) */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    {/* Registration/Onboarding */}
                    <Route path="/registration" element={<Registration />} />
                    
                    {/* Grocery Dashboard & Pages */}
                    <Route path="/grocery/dashboard" element={<GroceryDashboard />} />
                    <Route path="/grocery/products" element={<GroceryProducts />} />
                    <Route path="/grocery/orders" element={<GroceryOrders />} />
                    
                    {/* Restaurant Dashboard & Pages */}
                    <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
                    <Route path="/restaurant/menu" element={<RestaurantMenu />} />
                    <Route path="/restaurant/orders" element={<RestaurantOrders />} />
                    <Route path="/restaurant/bookings" element={<RestaurantBooking />} />
                    <Route path="/restaurant/offers" element={<RestaurantOffers />} />
                    <Route path="/restaurant/reports" element={<RestaurantReports />} />
                    <Route path="/restaurant/profile" element={<RestaurantProfile />} />
                </Route>

                {/* Redirect any unknown routes to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
