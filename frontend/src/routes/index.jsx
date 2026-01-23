import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import Loader from '../components/common/Loader';

// Lazy load pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ShopSetup = lazy(() => import('../pages/onboarding/ShopSetup'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const GroceryDashboard = lazy(() => import('../pages/Grocery/DAshboard'));
const Orders = lazy(() => import('../pages/orders/Orders'));
const Items = lazy(() => import('../pages/items/Items'));
const Discounts = lazy(() => import('../pages/discounts/Discounts'));
const Analytics = lazy(() => import('../pages/analytics/Analytics'));
const MainLayout = lazy(() => import('../components/layout/MainLayout'));
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const RestaurantDashboard = lazy(() => import('../pages/Restaurant/Dashboard'));
const GroceryProducts = lazy(() => import('../pages/Grocery/Products'));

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
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
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
                    <Route path="/registration" element={React.createElement(lazy(() => import('../pages/onboarding/Registration')))} />
                    <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
                    <Route path="/restaurant/menu" element={React.createElement(lazy(() => import('../pages/Restaurant/Menu')))} />
                    <Route path="/admin/orders" element={React.createElement(lazy(() => import('../pages/Restaurant/Orders')))} />
                    <Route element={<MainLayout />}> 
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/grocery/dashboard" element={<GroceryDashboard />} />
                        <Route path="/grocery/products" element={<GroceryProducts />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/items" element={<Items />} />
                        <Route path="/discounts" element={<Discounts />} />
                        <Route path="/analytics" element={<Analytics />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
