import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { API_BASE_URL } from '../../services/api';
import PrimaryButton from '../../components/common/PrimaryButton';
import './Login.css'; // Reusing Login styles for consistency

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Optional: Call backend for logging/rate limiting/validation
            try {
                const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 429) {
                        setError(errorData.message || 'Too many requests. Please try again later.');
                        setLoading(false);
                        return;
                    }
                }
            } catch (backendErr) {
                console.warn('Backend logging failed, proceeding with Firebase reset:', backendErr);
            }

            await sendPasswordResetEmail(auth, email);
            setMessage('If this email is registered, a password reset link has been sent.');
            setEmail('');
        } catch (err) {
            console.error('Password reset error:', err);
            if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Network error. Please try again later.');
            } else {
                // Generic error for everything else (including user-not-found for security)
                setMessage('If this email is registered, a password reset link has been sent.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">Enter your email to receive a reset link</p>

                {error && <div style={{ color: 'var(--error)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
                {message && <div style={{ color: 'var(--success-green, #28a745)', marginBottom: '16px', fontSize: '0.9rem' }}>{message}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your registered email"
                            required
                        />
                    </div>

                    <PrimaryButton type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </PrimaryButton>
                </form>

                <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Remember your password? <Link to="/login" style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
