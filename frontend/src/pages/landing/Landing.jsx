import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/landing/landing.css';
import Navbar from '../../components/layout/Navbar';
import PrimaryButton from '../../components/common/PrimaryButton';
import heroImg from '/fullbg.png'; // Assuming fullbg.png is a good hero image from public

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <Navbar isLanding={true} />

            <main className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Grow your business with <span className="highlight">BazarSe</span>
                    </h1>
                    <p className="hero-subtitle">
                        The all-in-one platform for sellers to manage orders, track inventory,
                        and reach millions of hungry customers instantly.
                    </p>
                    <div className="hero-actions">
                        <div style={{ width: '180px' }}>
                            <PrimaryButton onClick={() => navigate('/register')}>
                                Register Store
                            </PrimaryButton>
                        </div>
                        <div style={{ width: '150px' }}>
                            <PrimaryButton variant="outline" onClick={() => navigate('/login')}>
                                Login
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                <div className="hero-image-container">
                    <img src={heroImg} alt="BazarSe Dashboard Preview" className="hero-image" />
                </div>
            </main>
        </div>
    );
};

export default Landing;
