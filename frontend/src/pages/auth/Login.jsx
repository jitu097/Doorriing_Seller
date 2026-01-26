import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { shopService } from '../../services/shopService';
import PrimaryButton from '../../components/common/PrimaryButton';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    /**
     * CRITICAL: LOGIN REDIRECT LOGIC
     * Call backend to check shop status, then decide where to route
     */
    const handleLoginSuccess = async () => {
        try {
            setLoading(true);
            const response = await shopService.getShop();

            if (response.hasShop) {
                // Shop exists - go to dashboard
                const category = response.shop.business_type?.toLowerCase() || 'restaurant';
                const dashboardRoute = category === 'grocery' ? '/grocery/dashboard' : '/restaurant/dashboard';
                navigate(dashboardRoute, { replace: true });
            } else {
                // No shop - must register
                navigate('/registration', { replace: true });
            }
        } catch (err) {
            console.error('Shop check failed:', err);
            // Only redirect to registration if we are sure it's not a network/server error
            // If the error implies the user wasn't found or has no shop (404), that's fine.
            // But if the server is down, we should show an error message.
            if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
                navigate('/registration', { replace: true });
            } else {
                setError('Unable to verify account status. Please check your connection or try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            await handleLoginSuccess();
        } catch (err) {
            setError('Invalid email or password');
            console.error(err);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithPopup(auth, googleProvider);
            await handleLoginSuccess();
        } catch (err) {
            setError('Google Sign-In Failed');
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Log in to your seller dashboard</p>

                {error && <div style={{ color: 'var(--error)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleEmailLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <PrimaryButton type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </PrimaryButton>
                </form>

                <div className="divider">OR</div>

                <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                    Continue with Google
                </button>

                <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    New to BazarSe? <Link to="/register" style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
