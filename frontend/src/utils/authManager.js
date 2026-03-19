import { useEffect, useSyncExternalStore } from 'react';
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { shopService } from '../services/shopService';

export const LAST_ACTIVE_KEY = 'lastActive';

const LEGACY_LAST_ACTIVE_KEY = 'lastActiveTime';
const SELLER_HOME_ROUTE_KEY = 'sellerHomeRoute';
const SELECTED_CATEGORY_KEY = 'selectedCategory';
const INACTIVITY_LIMIT_MS = 48 * 60 * 60 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'touchstart'];
const DASHBOARD_ROUTES = {
  grocery: '/grocery/dashboard',
  restaurant: '/restaurant/dashboard',
};
const VALID_HOME_ROUTES = new Set([
  DASHBOARD_ROUTES.grocery,
  DASHBOARD_ROUTES.restaurant,
]);
const DEFAULT_AUTH_STATE = {
  isAuthReady: false,
  isAuthenticated: false,
  user: null,
};

let authState = DEFAULT_AUTH_STATE;
let initPromise = null;
let persistencePromise = null;
let authUnsubscribe = null;
let activityCleanup = null;
let lastActivityWriteAt = 0;
let initialAuthResolved = false;
let resolveInitialAuth = null;
let initialAuthPromise = null;

const subscribers = new Set();

const canUseWindow = () => typeof window !== 'undefined';
const canUseDocument = () => typeof document !== 'undefined';
const canUseStorage = () =>
  canUseWindow() && typeof window.localStorage !== 'undefined';

const notifySubscribers = () => {
  subscribers.forEach((listener) => listener());
};

const setAuthState = (nextState) => {
  authState = nextState;
  notifySubscribers();
};

const ensureInitialAuthPromise = () => {
  if (!initialAuthPromise) {
    initialAuthPromise = new Promise((resolve) => {
      resolveInitialAuth = resolve;
    });
  }

  if (authState.isAuthReady && !initialAuthResolved) {
    initialAuthResolved = true;
    resolveInitialAuth?.(authState);
  }

  return initialAuthPromise;
};

const resolveAuthReady = () => {
  if (!initialAuthResolved) {
    initialAuthResolved = true;
    resolveInitialAuth?.(authState);
  }
};

const readStorage = (key) => {
  if (!canUseStorage()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read localStorage key "${key}":`, error);
    return null;
  }
};

const writeStorage = (key, value) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to write localStorage key "${key}":`, error);
  }
};

const removeStorage = (key) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
  }
};

const parseTimestamp = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeHomeRoute = (route) =>
  VALID_HOME_ROUTES.has(route) ? route : null;

const isShopMissingError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('404') || message.includes('not found');
};

const getLastActiveTimestamp = () => {
  const currentValue = parseTimestamp(readStorage(LAST_ACTIVE_KEY));
  if (currentValue !== null) {
    return currentValue;
  }

  const legacyValue = parseTimestamp(readStorage(LEGACY_LAST_ACTIVE_KEY));
  if (legacyValue !== null) {
    writeStorage(LAST_ACTIVE_KEY, String(legacyValue));
  }

  removeStorage(LEGACY_LAST_ACTIVE_KEY);
  return legacyValue;
};

const ensurePersistence = async () => {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(
      (error) => {
        console.error('Firebase persistence setup failed:', error);
      }
    );
  }

  return persistencePromise;
};

const getCurrentPathDashboardRoute = () => {
  if (!canUseWindow()) return null;

  const pathname = window.location?.pathname || '';
  if (pathname.startsWith('/grocery/')) {
    return DASHBOARD_ROUTES.grocery;
  }
  if (pathname.startsWith('/restaurant/')) {
    return DASHBOARD_ROUTES.restaurant;
  }

  return null;
};

const getSelectedCategoryDashboardRoute = () => {
  const selectedCategory = String(readStorage(SELECTED_CATEGORY_KEY) || '').toLowerCase();
  if (!selectedCategory) return null;

  return getDashboardRoute(selectedCategory);
};

const getDefaultDashboardRoute = () =>
  getSelectedCategoryDashboardRoute() || DASHBOARD_ROUTES.restaurant;

export const getDashboardRoute = (businessType) => {
  const normalizedType = String(businessType || 'restaurant').toLowerCase();
  return normalizedType === 'grocery'
    ? DASHBOARD_ROUTES.grocery
    : DASHBOARD_ROUTES.restaurant;
};

export const getStoredHomeRoute = () => {
  const storedRoute = readStorage(SELLER_HOME_ROUTE_KEY);
  const normalizedRoute = normalizeHomeRoute(storedRoute);

  if (!normalizedRoute && storedRoute) {
    removeStorage(SELLER_HOME_ROUTE_KEY);
  }

  return normalizedRoute;
};

export const getFallbackAuthenticatedRoute = () =>
  getStoredHomeRoute() ||
  getCurrentPathDashboardRoute() ||
  getDefaultDashboardRoute();

export const setStoredHomeRoute = (route) => {
  const normalizedRoute = normalizeHomeRoute(route);
  if (!normalizedRoute) return;

  writeStorage(SELLER_HOME_ROUTE_KEY, normalizedRoute);
};

export const clearSessionMetadata = () => {
  lastActivityWriteAt = 0;
  removeStorage(LAST_ACTIVE_KEY);
  removeStorage(LEGACY_LAST_ACTIVE_KEY);
  removeStorage(SELLER_HOME_ROUTE_KEY);
};

export const trackUserActivity = (force = false) => {
  if (!canUseStorage() || !(auth.currentUser || authState.user)) {
    return null;
  }

  const now = Date.now();
  if (!force && now - lastActivityWriteAt < ACTIVITY_WRITE_THROTTLE_MS) {
    return now;
  }

  lastActivityWriteAt = now;
  writeStorage(LAST_ACTIVE_KEY, String(now));
  removeStorage(LEGACY_LAST_ACTIVE_KEY);
  return now;
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    clearSessionMetadata();
    setAuthState({
      isAuthReady: true,
      isAuthenticated: false,
      user: null,
    });
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};

export const checkInactivityAndLogout = async (user = auth.currentUser) => {
  if (!user) return false;

  const lastActive = getLastActiveTimestamp();
  if (lastActive === null) {
    return false;
  }

  if (Date.now() - lastActive <= INACTIVITY_LIMIT_MS) {
    return false;
  }

  return logoutUser();
};

const ensureLastActiveTimestamp = () => {
  if (getLastActiveTimestamp() === null) {
    trackUserActivity(true);
  }
};

const handleResume = async () => {
  if (!auth.currentUser) return;

  const loggedOut = await checkInactivityAndLogout(auth.currentUser);
  if (!loggedOut) {
    trackUserActivity(true);
  }
};

export const handleAuthState = async (user) => {
  if (!user) {
    clearSessionMetadata();
    setAuthState({
      isAuthReady: true,
      isAuthenticated: false,
      user: null,
    });
    resolveAuthReady();
    return authState;
  }

  const loggedOut = await checkInactivityAndLogout(user);
  if (loggedOut) {
    resolveAuthReady();
    return authState;
  }

  ensureLastActiveTimestamp();
  setAuthState({
    isAuthReady: true,
    isAuthenticated: true,
    user,
  });
  resolveAuthReady();
  return authState;
};

const startActivityTracking = () => {
  if (!canUseWindow() || !canUseDocument() || activityCleanup) {
    return activityCleanup;
  }

  const onActivity = () => {
    trackUserActivity();
  };

  const onFocus = () => {
    void handleResume();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void handleResume();
    }
  };

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, onActivity, { passive: true });
  });

  window.addEventListener('focus', onFocus);
  window.addEventListener('pageshow', onFocus);
  document.addEventListener('visibilitychange', onVisibilityChange);

  activityCleanup = () => {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, onActivity);
    });

    window.removeEventListener('focus', onFocus);
    window.removeEventListener('pageshow', onFocus);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    activityCleanup = null;
  };

  return activityCleanup;
};

export const resolveAuthenticatedRoute = async () => {
  const storedRoute = getFallbackAuthenticatedRoute();
  if (storedRoute) {
    return storedRoute;
  }

  try {
    const response = await shopService.getShop();

    if (!response?.hasShop) {
      return getFallbackAuthenticatedRoute();
    }

    const homeRoute = getDashboardRoute(
      response.shop?.business_type || response.shop?.category
    );
    setStoredHomeRoute(homeRoute);
    return homeRoute;
  } catch (error) {
    if (isShopMissingError(error)) {
      return getFallbackAuthenticatedRoute();
    }

    const fallbackRoute = getFallbackAuthenticatedRoute();
    if (fallbackRoute) {
      return fallbackRoute;
    }

    throw error;
  }
};

export const initAuth = async () => {
  if (!canUseWindow()) {
    return authState;
  }

  ensureInitialAuthPromise();

  if (initPromise) {
    return initialAuthPromise;
  }

  initPromise = (async () => {
    await ensurePersistence();
    startActivityTracking();

    if (!authUnsubscribe) {
      authUnsubscribe = onAuthStateChanged(auth, (user) => {
        void handleAuthState(user);
      });
    }

    return ensureInitialAuthPromise();
  })();

  await initPromise;
  return initialAuthPromise;
};

export const subscribeToAuthSession = (listener) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

export const getAuthSessionSnapshot = () => authState;

export const useAuthSession = () => {
  const session = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionSnapshot
  );

  useEffect(() => {
    void initAuth();
  }, []);

  return session;
};
