import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const ContactUs = () => {
    const navigate = useNavigate();
    return (
        <div className="legal-page">
            <div className="legal-container">
                <header className="legal-header">
                    <button onClick={() => navigate(-1)} className="legal-back-link">← Go Back</button>
                    <div className="legal-logo">
                        <img src="/Doorriing.png" alt="Doorriing" className="legal-logo-img" />
                    </div>
                    <h1 className="legal-title">Contact Us</h1>
                </header>
                <main className="legal-body">
                    <section className="legal-section">
                        <h2>Get in Touch</h2>
                        <p>We are here to help you. If you have any questions or concerns, please reach out to us.</p>
                        <p><strong>Email:</strong> support@doorriing.com</p>
                    </section>
                    <section className="legal-section">
                        <h2>Registered Office</h2>
                        <p>
                            Managed by JYOTIRMAY SHAKTI WORKS CONTRACT PRIVATE LIMITED<br />
                            Polytechnic Road, Banpur, Latehar,<br />
                            Latehar, Jharkhand - 829206, India.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default ContactUs;
