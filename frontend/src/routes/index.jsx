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
import { initNotifications } from '../utils/notificationManager';

const lazyWithRetry = (importer, key) =>
    lazy(async () => {
        try {
            const module = await importer();

            if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem(`lazy-retry:${key}`);
            }

            return module;
        } catch (error) {
            const retryKey = `lazy-retry:${key}`;
            const canRetry =
                typeof window !== 'undefined' &&
                !window.sessionStorage.getItem(retryKey);

            console.error(`Lazy route import failed for ${key}`, error);

            if (canRetry) {
                window.sessionStorage.setItem(retryKey, '1');
                window.location.reload();
                return new Promise(() => {});
            }

            throw error;
        }
    });

// Lazy load pages
const Login = lazyWithRetry(() => import('../pages/auth/Login'), 'login');
const Register = lazyWithRetry(() => import('../pages/auth/Register'), 'register');
const ForgotPassword = lazyWithRetry(() => import('../pages/auth/ForgotPassword'), 'forgot-password');
const Registration = lazyWithRetry(() => import('../pages/onboarding/Registration'), 'registration');
const LandingPage = lazyWithRetry(() => import('../pages/landing/LandingPage'), 'landing');
const TermsAndConditions = lazyWithRetry(() => import('../pages/legal/TermsAndConditions'), 'terms');
const AboutUs = lazyWithRetry(() => import('../pages/legal/AboutUs'), 'about');
const ContactUs = lazyWithRetry(() => import('../pages/legal/ContactUs'), 'contact');
const PrivacyPolicy = lazyWithRetry(() => import('../pages/legal/PrivacyPolicy'), 'privacy');
const RefundCancellation = lazyWithRetry(() => import('../pages/legal/RefundCancellation'), 'refund-cancellation');
const DeleteAccountInfo = lazyWithRetry(() => import('../pages/legal/DeleteAccountInfo'), 'delete-account');

// Grocery Pages
const GroceryDashboard = lazyWithRetry(() => import('../pages/Grocery/DAshboard'), 'grocery-dashboard');
const GroceryProducts = lazyWithRetry(() => import('../pages/Grocery/Products'), 'grocery-products');
const GroceryOrders = lazyWithRetry(() => import('../pages/Grocery/Orders'), 'grocery-orders');
const GroceryOffers = lazyWithRetry(() => import('../pages/Grocery/Offers'), 'grocery-offers');
const GroceryReports = lazyWithRetry(() => import('../pages/Grocery/Reports'), 'grocery-reports');
const GroceryProfile = lazyWithRetry(() => import('../pages/Grocery/Profile'), 'grocery-profile');
const GroceryLayout = lazyWithRetry(() => import('../pages/Grocery/GroceryLayout'), 'grocery-layout');
const WalletPage = lazyWithRetry(() => import('../pages/Wallet/Wallet'), 'wallet');

// Restaurant Pages
const RestaurantDashboard = lazyWithRetry(() => import('../pages/Restaurant/Dashboard'), 'restaurant-dashboard');
const RestaurantMenu = lazyWithRetry(() => import('../pages/Restaurant/Menu'), 'restaurant-menu');
const RestaurantOrders = lazyWithRetry(() => import('../pages/Restaurant/Orders'), 'restaurant-orders');
const RestaurantBooking = lazyWithRetry(() => import('../pages/Restaurant/Booking'), 'restaurant-bookings');
const RestaurantOffers = lazyWithRetry(() => import('../pages/Restaurant/offers'), 'restaurant-offers');
const RestaurantReports = lazyWithRetry(() => import('../pages/Restaurant/Reports'), 'restaurant-reports');
const RestaurantProfile = lazyWithRetry(() => import('../pages/Restaurant/Profile'), 'restaurant-profile');
const RestaurantLayout = lazyWithRetry(() => import('../pages/Restaurant/RestaurantLayout'), 'restaurant-layout');

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
    const { user } = useAuthSession();

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

    useEffect(() => {
        if (!hasShop || !user?.uid) {
            return;
        }

        initNotifications(user).catch((error) => {
            console.error('Push notification initialization failed', error);
        });
    }, [hasShop, user?.uid]);

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
