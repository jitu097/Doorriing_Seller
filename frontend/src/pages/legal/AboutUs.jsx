import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const AboutUs = () => {
    const navigate = useNavigate();
    return (
        <div className="legal-page">
            <div className="legal-container">
                <header className="legal-header">
                    <button onClick={() => navigate(-1)} className="legal-back-link">← Go Back</button>
                    <div className="legal-logo">
                        <img src="/Doorriing.png" alt="Doorriing" className="legal-logo-img" />
                    </div>
                    <h1 className="legal-title">About Us</h1>
                </header>
                <main className="legal-body">
                    <section className="legal-section">
                        <h2>Our Story</h2>
                        <p>
                            Doorriing is a local delivery platform dedicated to connecting local businesses with their customers. We believe in empowering local shops and providing a seamless delivery experience.
                        </p>
                    </section>
                    <section className="legal-section">
                        <h2>Our Mission</h2>
                        <p>
                            To bridge the gap between local sellers and technology, making local commerce faster, easier, and more reliable for everyone.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default AboutUs;
