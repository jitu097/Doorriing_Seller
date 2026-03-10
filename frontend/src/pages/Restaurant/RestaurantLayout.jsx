import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './RestaurantLayout.css';

const RestaurantLayout = () => {
    return (
        <div className="restaurant-layout">
            <div className="layout-main">
                <div className="layout-navbar">
                    <Navbar />
                </div>
                <main className="layout-content">
                    <Outlet />
                </main>
                <footer className="app-footer">
                    © 2026 All Rights Reserved to Doorriing.com
                </footer>
            </div>
        </div>
    );
};

export default RestaurantLayout;
