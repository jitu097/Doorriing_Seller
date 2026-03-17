import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../../components/common/Footer';
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
                <Footer />
            </div>
        </div>
    );
};

export default RestaurantLayout;
