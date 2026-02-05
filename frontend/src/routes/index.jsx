import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { shopService } from '../services/shopService';
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
const GroceryOffers = lazy(() => import('../pages/Grocery/Offers'));
const GroceryReports = lazy(() => import('../pages/Grocery/Reports'));
const GroceryProfile = lazy(() => import('../pages/Grocery/Profile'));
const GroceryLayout = lazy(() => import('../pages/Grocery/GroceryLayout'));

// Restaurant Pages
const RestaurantDashboard = lazy(() => import('../pages/Restaurant/Dashboard'));
const RestaurantMenu = lazy(() => import('../pages/Restaurant/Menu'));
const RestaurantOrders = lazy(() => import('../pages/Restaurant/Orders'));
const RestaurantBooking = lazy(() => import('../pages/Restaurant/Booking'));
const RestaurantOffers = lazy(() => import('../pages/Restaurant/offers'));
const RestaurantReports = lazy(() => import('../pages/Restaurant/Reports'));
const RestaurantProfile = lazy(() => import('../pages/Restaurant/Profile'));
const RestaurantLayout = lazy(() => import('../pages/Restaurant/RestaurantLayout'));

/**
 * ROUTE GUARD: Basic Authentication
 * Checks if user is logged in
 */
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

/**
 * ROUTE GUARD: Shop Required
 * Checks if user has created shop
 * Redirects to /registration if not
 */
const RequireShop = () => {
    const [loading, setLoading] = useState(true);
    const [hasShop, setHasShop] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkShop = async () => {
            try {
                const response = await shopService.getShop();
                if (!response.hasShop) {
                    navigate('/registration', { replace: true });
                } else {
                    setHasShop(true);
                }
            } catch (error) {
                console.error('Shop check failed:', error);
                navigate('/registration', { replace: true });
            } finally {
                setLoading(false);
            }
        };
        checkShop();
    }, [navigate]);

    if (loading) return <Loader variant="fullscreen" message="Checking shop status..." />;
    return hasShop ? <Outlet /> : null;
};

const PublicRoute = () => {
    return <Outlet />;
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

                {/* Protected Routes - Authentication Required */}
                <Route element={<ProtectedRoute />}>
                    {/* Registration - No shop required */}
                    <Route path="/registration" element={<Registration />} />

                    {/* Shop Required Routes */}
                    <Route element={<RequireShop />}>
                        {/* Grocery Dashboard & Pages */}
                        <Route element={<GroceryLayout />}>
                            <Route path="/grocery/dashboard" element={<GroceryDashboard />} />
                            <Route path="/grocery/products" element={<GroceryProducts />} />
                            <Route path="/grocery/orders" element={<GroceryOrders />} />
                            <Route path="/grocery/offers" element={<GroceryOffers />} />
                            <Route path="/grocery/reports" element={<GroceryReports />} />
                            <Route path="/grocery/profile" element={<GroceryProfile />} />
                        </Route>

                        {/* Restaurant Dashboard & Pages */}
                        <Route element={<RestaurantLayout />}>
                            <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
                            <Route path="/restaurant/menu" element={<RestaurantMenu />} />
                            <Route path="/restaurant/orders" element={<RestaurantOrders />} />
                            <Route path="/restaurant/bookings" element={<RestaurantBooking />} />
                            <Route path="/restaurant/offers" element={<RestaurantOffers />} />
                            <Route path="/restaurant/reports" element={<RestaurantReports />} />
                            <Route path="/restaurant/profile" element={<RestaurantProfile />} />
                        </Route>
                    </Route>
                </Route>

                {/* Redirect any unknown routes to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
