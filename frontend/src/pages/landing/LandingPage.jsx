import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <Loader variant="fullscreen" message="Welcome to BazarSe Seller..." />;
    }

    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="brand">BazarSe Seller</div>
                <div className="nav-links">
                    <Link to="/login" className="nav-btn login-link">Log In</Link>
                    <Link to="/register" className="nav-btn signup-link">Join Now</Link>
                </div>
            </nav>

            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Grow Your Business with <br />
                        <span>BazarSe Partner</span>
                    </h1>
                    <p className="hero-subtitle">
                        The easiest way to manage your shop, orders, and products online.
                        Join thousands of sellers who trust BazarSe for their daily operations.
                    </p>

                    <div className="cta-group">
                        <button className="cta-btn primary-cta" onClick={() => navigate('/register')}>
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
