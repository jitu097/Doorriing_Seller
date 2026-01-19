import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './MainLayout.css';

const MainLayout = () => {
    return (
        <div className="main-layout">
            <Navbar />
            <main className="page-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
