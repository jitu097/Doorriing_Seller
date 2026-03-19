import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthSession } from '../utils/authManager';

const PublicRoutes = () => {
    const { isAuthReady, isAuthenticated } = useAuthSession();

    if (!isAuthReady) {
        return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    // If authenticated, redirect to dashboard. Otherwise render child routes (Login/Register)
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoutes;
