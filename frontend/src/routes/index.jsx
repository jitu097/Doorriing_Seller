import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { shopService } from '../services/shopService';
import Loader from '../components/common/Loader';
import OrderAlertManager from '../components/Orders/OrderAlertManager';
import {
    getFallbackAuthenticatedRoute,
    getDashboardRoute,
    resolveAuthenticatedRoute,
    setStoredHomeRoute,
    useAuthSession,
} from '../utils/authManager';

// Lazy load pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Registration = lazy(() => import('../pages/onboarding/Registration'));
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const TermsAndConditions = lazy(() => import('../pages/legal/TermsAndConditions'));
const AboutUs = lazy(() => import('../pages/legal/AboutUs'));
const ContactUs = lazy(() => import('../pages/legal/ContactUs'));
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'));
const RefundCancellation = lazy(() => import('../pages/legal/RefundCancellation'));
const DeleteAccountInfo = lazy(() => import('../pages/legal/DeleteAccountInfo'));

// Grocery Pages
const GroceryDashboard = lazy(() => import('../pages/Grocery/DAshboard'));
const GroceryProducts = lazy(() => import('../pages/Grocery/Products'));
const GroceryOrders = lazy(() => import('../pages/Grocery/Orders'));
const GroceryOffers = lazy(() => import('../pages/Grocery/Offers'));
const GroceryReports = lazy(() => import('../pages/Grocery/Reports'));
const GroceryProfile = lazy(() => import('../pages/Grocery/Profile'));
const GroceryLayout = lazy(() => import('../pages/Grocery/GroceryLayout'));
const WalletPage = lazy(() => import('../pages/Wallet/Wallet'));

// Restaurant Pages
const RestaurantDashboard = lazy(() => import('../pages/Restaurant/Dashboard'));
const RestaurantMenu = lazy(() => import('../pages/Restaurant/Menu'));
const RestaurantOrders = lazy(() => import('../pages/Restaurant/Orders'));
const RestaurantBooking = lazy(() => import('../pages/Restaurant/Booking'));
const RestaurantOffers = lazy(() => import('../pages/Restaurant/offers'));
const RestaurantReports = lazy(() => import('../pages/Restaurant/Reports'));
const RestaurantProfile = lazy(() => import('../pages/Restaurant/Profile'));
const RestaurantLayout = lazy(() => import('../pages/Restaurant/RestaurantLayout'));

const useResolvedAuthenticatedRoute = (enabled, userId) => {
    const [state, setState] = useState({
        loading: enabled,
        route: null,
    });

    useEffect(() => {
        if (!enabled) {
            setState({ loading: false, route: null });
            return undefined;
        }

        let cancelled = false;
        setState((previousState) => ({
            loading: true,
            route: previousState.route,
        }));

        resolveAuthenticatedRoute()
            .then((route) => {
                if (!cancelled) {
                    setState({ loading: false, route });
                }
            })
            .catch((error) => {
                console.error('Authenticated route resolution failed:', error);

                if (!cancelled) {
                    setState({
                        loading: false,
                        route: getFallbackAuthenticatedRoute(),
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, userId]);

    return state;
};

/**
 * ROUTE GUARD: Basic Authentication
 * Checks if user is logged in
 */
const ProtectedRoute = () => {
    const { isAuthReady, isAuthenticated } = useAuthSession();

    if (!isAuthReady) return <Loader variant="fullscreen" message="Loading..." />;
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
                    const homeRoute = getDashboardRoute(
                        response.shop?.business_type || response.shop?.category
                    );
                    setStoredHomeRoute(homeRoute);
                    setHasShop(true);
                }
            } catch (error) {
                console.error('Shop check failed:', error);
                if (String(error?.message || '').toLowerCase().includes('404') || String(error?.message || '').toLowerCase().includes('not found')) {
                    navigate('/registration', { replace: true });
                } else {
                    const fallbackRoute = getFallbackAuthenticatedRoute();
                    if (fallbackRoute) {
                        setStoredHomeRoute(fallbackRoute);
                    }
                    setHasShop(true);
                }
            } finally {
                setLoading(false);
            }
        };
        checkShop();
    }, [navigate]);

    if (loading) return <Loader variant="fullscreen" message="Checking shop status..." />;
    return hasShop ? (
        <>
            <OrderAlertManager />
            <Outlet />
        </>
    ) : null;
};

const AuthOnlyPublicRoute = () => {
    const { isAuthReady, isAuthenticated, user } = useAuthSession();
    const { loading: routeLoading, route } = useResolvedAuthenticatedRoute(isAuthenticated, user?.uid);

    if (!isAuthReady || routeLoading) {
        return <Loader variant="fullscreen" message="Loading..." />;
    }

    return isAuthenticated ? <Navigate to={route || getFallbackAuthenticatedRoute()} replace /> : <Outlet />;
};

const AppEntryRoute = () => {
    const { isAuthReady, isAuthenticated, user } = useAuthSession();
    const { loading: routeLoading, route } = useResolvedAuthenticatedRoute(isAuthenticated, user?.uid);

    if (!isAuthReady || routeLoading) {
        return <Loader variant="fullscreen" message="Loading..." />;
    }

    return (
        <Navigate
            to={isAuthenticated ? route || getFallbackAuthenticatedRoute() : '/login'}
            replace
        />
    );
};

const DashboardRoute = () => {
    const { isAuthReady, isAuthenticated, user } = useAuthSession();
    const { loading: routeLoading, route } = useResolvedAuthenticatedRoute(isAuthenticated, user?.uid);

    if (!isAuthReady || routeLoading) {
        return <Loader variant="fullscreen" message="Loading..." />;
    }

    return <Navigate to={isAuthenticated ? route || getFallbackAuthenticatedRoute() : '/login'} replace />;
};

// --- Main Routes ---

const AppRoutes = () => {
    return (
        <Suspense fallback={<Loader variant="fullscreen" message="Loading App..." />}>
            <Routes>
                {/* App Entry */}
                <Route path="/" element={<AppEntryRoute />} />
                <Route path="/dashboard" element={<DashboardRoute />} />
                <Route path="/landing" element={<LandingPage />} />

                {/* Auth Pages */}
                <Route element={<AuthOnlyPublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Public Routes */}
                <Route element={<Outlet />}>
                    <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/refund-cancellation" element={<RefundCancellation />} />
                    <Route path="/delete-account" element={<DeleteAccountInfo />} />
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
                            <Route path="/grocery/wallet" element={<WalletPage />} />
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
                            <Route path="/restaurant/wallet" element={<WalletPage />} />
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
