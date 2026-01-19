import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import '../../styles/auth/register.css';
import PrimaryButton from '../../components/common/PrimaryButton';
import bgImage from '/groceryman.png';

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Registration success
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Registration failed. Try a stronger password or different email.');
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
                <img src={bgImage} alt="Register Background" className="auth-bg-image" />
                <div className="auth-overlay"></div>
            </div>

            <div className="auth-form-side">
                <div className="auth-header">
                    <h2 className="auth-title">Become a Partner</h2>
                    <p>Join thousands of sellers on BazarSe</p>
                </div>

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label className="input-label">Work Email</label>
                        <input
                            type="email"
                            className="text-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="store@business.com"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Create Password</label>
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
                        {loading ? 'Creating Account...' : 'Continue'}
                    </PrimaryButton>
                </form>

                <div className="auth-divider">OR</div>

                <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
                    Sign up with Google
                </button>

                <p style={{ marginTop: '24px', textAlign: 'center' }}>
                    Already have an account? <Link to="/login" className="auth-link">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
