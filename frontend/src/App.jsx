import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { initAuth } from './utils/authManager';
import './App.css';

function App() {
    useEffect(() => {
        void initAuth();
    }, []);

    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
