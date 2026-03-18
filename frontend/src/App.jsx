import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import useInactivityLogout from './hooks/useInactivityLogout';
import './App.css';

function App() {
    // Enable inactivity-based logout
    useInactivityLogout();

    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
