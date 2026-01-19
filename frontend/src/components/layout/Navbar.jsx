import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import './Navbar.css';

const Navbar = () => {
    const handleLogout = () => {
        signOut(auth);
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                {/* Placeholder for Logo */}
                <div style={{ width: 32, height: 32, backgroundColor: 'var(--primary-orange)', borderRadius: 8 }}></div>
                <span className="brand-text">BazarSe Seller</span>
            </div>

            <div className="nav-user">
                <div className="user-avatar">S</div>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
