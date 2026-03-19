import { useEffect, useCallback } from 'react';
import {
    initAuth,
    logoutUser,
    trackUserActivity,
} from '../utils/authManager';

const useInactivityLogout = () => {
    const logout = useCallback(async () => {
        const loggedOut = await logoutUser();
        if (loggedOut) {
            window.location.href = '/login';
        }
    }, []);

    const updateActivity = useCallback(() => {
        trackUserActivity(true);
    }, []);

    useEffect(() => {
        void initAuth();
    }, []);

    return { updateActivity, logout };
};

export default useInactivityLogout;
