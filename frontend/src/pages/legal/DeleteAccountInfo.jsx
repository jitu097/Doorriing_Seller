import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

const DeleteAccountInfo = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-container">
                <header className="legal-header">
                    <button onClick={() => navigate(-1)} className="legal-back-link">
                        ← Back
                    </button>
                    <img src="/Doorriing.png" alt="Doorriing Logo" className="legal-logo-img" />
                    <h1 className="legal-title">Delete Your Doorriing Account</h1>
                </header>

                <div className="legal-body">
                    <div className="legal-section">
                        <p>If you wish to delete your account and all associated data, you can do so in the following ways:</p>
                    </div>

                    <div className="legal-section">
                        <h2>Option 1: Via the App</h2>
                        <p>Log in to the Doorriing Partner app, go to <strong>Profile Settings</strong>, and click on <strong>"Delete Account"</strong>.</p>
                    </div>

                    <div className="legal-section">
                        <h2>Option 2: Via Email</h2>
                        <p>Send a request to <a href="mailto:support@doorriing.com" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>support@doorriing.com</a> with your registered email address, and we will process your request within 48 hours.</p>
                    </div>

                    <div className="legal-section" style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff7ed', borderRadius: '12px', borderLeft: '4px solid #f97316' }}>
                        <h2>Note:</h2>
                        <p style={{ margin: 0, color: '#9a3412', fontWeight: '500' }}>
                            Deleting your account will permanently remove all your data including orders, profile details, and store information. This action is irreversible.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountInfo;
