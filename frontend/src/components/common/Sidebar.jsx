import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { shopService } from '../../services/shopService';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, menuItems, profilePath }) => {
    const navigate = useNavigate();
    const [isShopOpen, setIsShopOpen] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState(false);

    useEffect(() => {
        fetchShopStatus();
    }, []);

    const fetchShopStatus = async () => {
        try {
            const shop = await shopService.getShop();
            setIsShopOpen(shop?.is_open ?? true);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleShopStatus = async () => {
        try {
            setLoadingStatus(true);
            const newStatus = !isShopOpen;
            await shopService.toggleStatus(newStatus);
            setIsShopOpen(newStatus);
        } finally {
            setLoadingStatus(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm('Logout?')) return;
        await signOut(auth);
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (onClose) onClose();
    };



    return (
        <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>

            <button className="sidebar-close-btn" onClick={onClose}>
                ✕
            </button>

            {/* Logo Area */}
            <div className="sidebar-logo">
                <img src="/logo.png" alt="Logo" />
            </div>

            {/* Shop Status Toggle (Admin Panel) */}
            <div className="shop-status-toggle">
                <button
                    className={`status-btn ${isShopOpen ? 'open' : 'closed'}`}
                    onClick={toggleShopStatus}
                    disabled={loadingStatus}
                >
                    <span className={`status-dot ${isShopOpen ? 'green' : 'red'}`}></span>
                    {isShopOpen ? 'Shop Open' : 'Shop Closed'}
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
                {(menuItems || []).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        <span className="active-indicator"></span>
                        <div className="nav-icon-bg">
                            {item.icon}
                        </div>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="sidebar-bottom">
                <button className="profile-btn" onClick={() => { navigate(profilePath || '/profile'); handleLinkClick(); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
