import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userInfo, setUserInfo] = useState({ name: 'Demo User', email: 'demo@bazarse.com' });
    const menuRef = useRef(null);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '📊' },
        { name: 'Orders', path: '/orders', icon: '📦' },
        { name: 'Items', path: '/items', icon: '🛍️' },
        { name: 'Discounts', path: '/discounts', icon: '🏷️' },
        { name: 'Analytics', path: '/analytics', icon: '📈' },
    ];

    // Get user initials from name
    const getInitials = (name) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Get user data from Firebase (demo for now)
    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const displayName = user.displayName || 'Demo User';
            const email = user.email || 'demo@bazarse.com';
            setUserInfo({ name: displayName, email });
        }
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <div className="nav-brand">
                    <img src="/logo.png" alt="BazarSe" className="brand-logo" />
                    <span className="brand-text">BazarSe Seller</span>
                </div>

                <div className="nav-links">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-text">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="nav-right">
                <div className="user-menu" ref={menuRef}>
                    <button 
                        className="user-trigger" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-expanded={isMenuOpen}
                    >
                        <div className="user-avatar">
                            {getInitials(userInfo.name)}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{userInfo.name}</span>
                            <span className="user-email">{userInfo.email}</span>
                        </div>
                        <svg 
                            className={`dropdown-arrow ${isMenuOpen ? 'open' : ''}`}
                            width="20" 
                            height="20" 
                            viewBox="0 0 20 20" 
                            fill="none"
                        >
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>

                    {isMenuOpen && (
                        <div className="dropdown-menu">
                            <div className="menu-header">
                                <div className="menu-avatar">
                                    {getInitials(userInfo.name)}
                                </div>
                                <div className="menu-info">
                                    <p className="menu-name">{userInfo.name}</p>
                                    <p className="menu-email">{userInfo.email}</p>
                                </div>
                            </div>
                            
                            <div className="menu-divider"></div>
                            
                            <div className="menu-items">
                                <button className="menu-item" onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>
                                    <span className="menu-icon">👤</span>
                                    <span>My Profile</span>
                                </button>
                                <button className="menu-item" onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}>
                                    <span className="menu-icon">⚙️</span>
                                    <span>Settings</span>
                                </button>
                                <button className="menu-item" onClick={() => { navigate('/help'); setIsMenuOpen(false); }}>
                                    <span className="menu-icon">❓</span>
                                    <span>Help & Support</span>
                                </button>
                            </div>
                            
                            <div className="menu-divider"></div>
                            
                            <button className="menu-item logout" onClick={handleLogout}>
                                <span className="menu-icon">🚪</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
