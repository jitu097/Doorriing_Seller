import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="doorriing-footer">
            <div className="footer-top">
                <div className="footer-top-content">
                    <p className="footer-shop-local">Shop Local</p>
                    <p className="footer-delivers">Doorriing Delivers ❤️</p>
                    <h2 className="footer-brand">DOORRIING</h2>
                </div>
            </div>

            <div className="footer-main">
                <div className="footer-container">
                    <div className="footer-grid">
                        {/* Column 1: Brand Info */}
                        <div className="footer-col brand-info">
                            <h3>Doorriing</h3>
                            <p>(Managed by JYOTIRMAY SHAKTI WORKS CONTRACT PRIVATE LIMITED)</p>
                            <p className="copyright">© 2026 Doorriing. All rights reserved.</p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="footer-col quick-links">
                            <h3>Company</h3>
                            <ul>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                                <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
                                <li><Link to="/refund-cancellation">Refund / Cancellation</Link></li>
                                <li><Link to="/delete-account">Delete Account</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-container">
                    <p className="legal-line">
                        Doorriing (Managed by JYOTIRMAY SHAKTI WORKS CONTRACT PRIVATE LIMITED) — Registered Office: Polytechnic Road, Banpur, Latehar, Latehar, Jharkhand - 829206, India.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
