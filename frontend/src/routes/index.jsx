import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

// Lazy load pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ShopSetup = lazy(() => import('../pages/onboarding/ShopSetup'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const MainLayout = lazy(() => import('../components/layout/MainLayout'));
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));

// --- Route Guards (Consolidated) ---

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    if (isAuthenticated === null) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
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

    if (isAuthenticated === null) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// --- Main Routes ---

const AppRoutes = () => {
    return (
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading App...</div>}>
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
                    <Route path="/setup-shop" element={<ShopSetup />} />
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
