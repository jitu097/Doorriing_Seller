import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="brand">Doorriing Seller</div>
                <div className="nav-links">
                    <Link to="/login" className="nav-btn login-link">Log In</Link>
                    <Link to="/login" className="nav-btn signup-link">Join Now</Link>
                </div>
            </nav>

            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Grow Your Business with <br />
                        <span>Doorriing Partner</span>
                    </h1>
                    <p className="hero-subtitle">
                        The easiest way to manage your shop, orders, and products online.
                        Join thousands of sellers who trust Doorriing for their daily operations.
                    </p>

                    <div className="cta-group">
                        <button className="cta-btn primary-cta" onClick={() => navigate('/login')}>
                            Start Selling Today
                        </button>
                        <button className="cta-btn secondary-cta" onClick={() => navigate('/login')}>
                            Seller Login
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
