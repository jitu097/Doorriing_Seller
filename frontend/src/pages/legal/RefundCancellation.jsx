import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const RefundCancellation = () => {
    const navigate = useNavigate();
    return (
        <div className="legal-page">
            <div className="legal-container">
                <header className="legal-header">
                    <button onClick={() => navigate(-1)} className="legal-back-link">← Go Back</button>
                    <div className="legal-logo">
                        <img src="/Doorriing.png" alt="Doorriing" className="legal-logo-img" />
                    </div>
                    <h1 className="legal-title">Refund / Cancellation Policy</h1>
                </header>
                <main className="legal-body">
                    <section className="legal-section">
                        <h2>1. Cancellation</h2>
                        <p>Orders can be cancelled by the customer within a specific time frame as defined by the shop's policy.</p>
                    </section>
                    <section className="legal-section">
                        <h2>2. Refunds</h2>
                        <p>Refunds will be processed in case of cancelled orders or issues with the delivered products, subject to verification.</p>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default RefundCancellation;
