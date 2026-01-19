import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import PrimaryButton from '../../components/common/PrimaryButton';
import './Login.css'; // Reusing Login styles for consistency as layout is identical

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/setup-shop'); // Direct to shop setup after register
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/setup-shop');
        } catch (err) {
            setError('Google Sign-In Failed');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join as a BazarSe Seller today</p>

                {error && <div style={{ color: 'var(--error)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleRegister}>
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
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <PrimaryButton type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </PrimaryButton>
                </form>

                <div className="divider">OR</div>

                <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                    Sign up with Google
                </button>

                <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-orange)', fontWeight: '600' }}>Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
