import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Footer from '../../components/common/Footer';
import Lottie from 'lottie-react';
import loaderAnimation from '../../assets/loader.json';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <nav className="landing-nav" style={{ justifyContent: 'flex-start' }}>
                <div className="brand">Doorriing Partner</div>
            </nav>

            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Grow Your Business with <br />
                        <span>Doorriing Partner</span>
                    </h1>

                        
                    <div style={{ width: 300, margin: '0 auto' }}>
                        <Lottie animationData={loaderAnimation} loop={true} style={{ width: '100%', height: '100%' }} />
                    </div>
       

                    <button className="cta-btn primary-cta" onClick={() => navigate('/login')} style={{ margin: '0 auto', display: 'block' }}>
                        Get Started
                    </button>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default LandingPage;
