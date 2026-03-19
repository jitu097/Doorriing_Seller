import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthSession } from '../utils/authManager';

const ProtectedRoutes = () => {
    const { isAuthReady, isAuthenticated } = useAuthSession();

    if (!isAuthReady) {
        // Return a simple loading spinner or blank screen while checking auth
        return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoutes;
