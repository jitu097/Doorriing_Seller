import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/layout/navbar.css';

const Navbar = ({ isLanding = false }) => {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <img src="/logo.png" alt="BazarSe Logo" className="navbar-logo" />
                <span>Seller Central</span>
            </div>

            <div className="navbar-actions">
                {isLanding ? (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        {/* Register button via hero usually */}
                    </>
                ) : (
                    <div className="seller-info">
                        <span>My Shop</span>
                        <div className="seller-avatar">S</div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
