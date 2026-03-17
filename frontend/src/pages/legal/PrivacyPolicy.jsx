import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    return (
        <div className="legal-page">
            <div className="legal-container">
                <header className="legal-header">
                    <button onClick={() => navigate(-1)} className="legal-back-link">← Go Back</button>
                    <div className="legal-logo">
                        <img src="/Doorriing.png" alt="Doorriing" className="legal-logo-img" />
                    </div>
                    <h1 className="legal-title">Privacy Policy</h1>
                </header>
                <main className="legal-body">
                    <section className="legal-section">
                        <h2>1. Information We Collect</h2>
                        <p>We collect information that you provide to us directly, such as when you create an account, update your profile, or communicate with us.</p>
                    </section>
                    <section className="legal-section">
                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect to provide, maintain, and improve our services, and to process transactions.</p>
                    </section>
                    <section className="legal-section">
                        <h2>3. Sharing of Information</h2>
                        <p>We do not share your personal information with third parties except as described in this policy.</p>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
