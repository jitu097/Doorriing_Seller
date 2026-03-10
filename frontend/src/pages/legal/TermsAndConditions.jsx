import React from 'react';
import { Link } from 'react-router-dom';
import './TermsAndConditions.css';

const TermsAndConditions = () => {
    return (
        <div className="terms-page">
            <div className="terms-container">
                {/* Header */}
                <header className="terms-header">
                    <Link to="/" className="terms-back-link">← Back to Home</Link>
                    <div className="terms-logo">
                        <img src="/Doorriing.png" alt="Doorriing" className="terms-logo-img" />
                    </div>
                    <h1 className="terms-title">Terms & Conditions</h1>
                    <p className="terms-subtitle">
                        Last updated: March 2026 &nbsp;·&nbsp; Version 1.0
                    </p>
                </header>

                {/* Body */}
                <main className="terms-body">

                    <section className="terms-section">
                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to <strong>Doorriing</strong> ("Platform", "we", "our", or "us"). By registering as a seller on Doorriing, you agree to be bound by these Terms & Conditions. Please read them carefully before completing your registration.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>2. Seller Eligibility</h2>
                        <p>To register as a seller on Doorriing, you must:</p>
                        <ul>
                            <li>Be at least 18 years of age.</li>
                            <li>Operate a legitimate business registered in India.</li>
                            <li>Hold a valid PAN card and Aadhaar number.</li>
                            <li>Agree to conduct business in compliance with all applicable Indian laws and regulations.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>3. Seller Responsibilities</h2>
                        <p>As a registered seller, you agree to:</p>
                        <ul>
                            <li>Provide accurate and up-to-date information about your shop and products.</li>
                            <li>Maintain sufficient inventory to fulfil customer orders.</li>
                            <li>Fulfill orders in a timely manner as per the platform's delivery standards.</li>
                            <li>Keep your shop status (open/closed) updated accurately.</li>
                            <li>Not list any prohibited, illegal, or counterfeit products.</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>4. Payments & Wallet</h2>
                        <p>
                            Doorriing maintains a digital wallet for each seller. Earnings from fulfilled orders are credited to your wallet automatically. Withdrawals are subject to the platform's payout schedule and policies. Doorriing reserves the right to withhold payments in cases of suspected fraud or policy violation.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>5. Product Listings</h2>
                        <p>
                            All product listings must accurately represent the items being sold. Misleading descriptions, incorrect pricing, or misrepresented products may result in suspension of your account. Doorriing reserves the right to remove any listing that violates community standards or applicable laws.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>6. Account Suspension & Termination</h2>
                        <p>
                            Doorriing reserves the right to suspend or permanently terminate seller accounts that violate these Terms, engage in fraudulent activity, receive consistently poor customer reviews, or fail to maintain service standards. You will be notified via registered email in case of suspension.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>7. Data & Privacy</h2>
                        <p>
                            By registering, you consent to the collection and processing of your personal and business data as described in our Privacy Policy. Your data will not be sold to third parties. We use your information to operate the platform, process transactions, and improve our services.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>8. Commission & Fees</h2>
                        <p>
                            Doorriing may charge a commission on orders fulfilled through the platform. Any applicable commission rates will be communicated to sellers in advance. The current platform launch phase operates with a zero commission structure — subject to change with 30 days prior notice.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>9. Changes to Terms</h2>
                        <p>
                            We may update these Terms from time to time. Sellers will be notified of significant changes via in-app notifications and email. Continued use of the platform after changes take effect constitutes acceptance of the revised Terms.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>10. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of India. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Jharkhand, India.
                        </p>
                    </section>

                    <section className="terms-section">
                        <h2>11. Contact Us</h2>
                        <p>
                            For questions about these Terms, contact us at{' '}
                            <a href="mailto:support@doorriing.com" className="terms-email-link">support@doorriing.com</a>.
                        </p>
                    </section>

                </main>

                <footer className="terms-footer">
                    © 2026 All Rights Reserved to Doorriing.com
                </footer>
            </div>
        </div>
    );
};

export default TermsAndConditions;
