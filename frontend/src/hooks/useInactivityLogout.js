import { useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const INACTIVITY_LIMIT = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const LAST_ACTIVE_KEY = 'lastActiveTime';

const useInactivityLogout = () => {
    const logout = useCallback(async () => {
        try {
            await signOut(auth);
            localStorage.removeItem(LAST_ACTIVE_KEY);
            // Optional: clear other app-specific keys if needed
            console.log('User logged out due to inactivity');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, []);

    const updateActivity = useCallback(() => {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }, []);

    const checkInactivity = useCallback(() => {
        const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActive && auth.currentUser) {
            const now = Date.now();
            if (now - parseInt(lastActive, 10) > INACTIVITY_LIMIT) {
                logout();
            }
        }
    }, [logout]);

    useEffect(() => {
        // Initial check on load
        checkInactivity();

        // Update activity on various events
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            updateActivity();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Periodic check every hour
        const interval = setInterval(checkInactivity, 60 * 60 * 1000);

        // Update activity initially
        updateActivity();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
        };
    }, [checkInactivity, updateActivity]);

    return { updateActivity, logout };
};

export default useInactivityLogout;
