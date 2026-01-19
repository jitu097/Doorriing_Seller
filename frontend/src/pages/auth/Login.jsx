import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import '../../styles/auth/login.css';
import PrimaryButton from '../../components/common/PrimaryButton';
import bgImage from '/formimage.png';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Success, route usually handled by auth listener or navigate here
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Google sign-in failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-image-side">
                <img src={bgImage} alt="Login Background" className="auth-bg-image" />
                <div className="auth-overlay"></div>
            </div>

            <div className="auth-form-side">
                <div className="auth-header">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p>Login to manage your restaurant</p>
                </div>

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="text-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="partner@bazarse.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="text-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <PrimaryButton type="submit">
                        {loading ? 'Logging in...' : 'Login'}
                    </PrimaryButton>
                </form>

                <div className="auth-divider">OR</div>

                <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
                    Continue with Google
                </button>

                <p style={{ marginTop: '24px', textAlign: 'center' }}>
                    New to BazarSe? <Link to="/register" className="auth-link">Register your store</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
