import { useRef, useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function LoginModal({ onClose }) {
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const emailRef = useRef();
    const passRef = useRef();
    const backdropRef = useRef();

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const email = emailRef.current.value.trim();
        const pass = passRef.current.value;
        // Tiny delay for UX feel
        setTimeout(() => {
            const ok = login(email, pass);
            if (ok) {
                onClose();
            } else {
                setError('Invalid email or password.');
                setLoading(false);
            }
        }, 300);
    };

    return (
        <div
            className="modal-backdrop"
            ref={backdropRef}
            onClick={(e) => e.target === backdropRef.current && onClose()}
        >
            <div className="modal login-modal">
                <div className="modal-header">
                    <h2>Admin Login</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <p className="login-subtitle">
                    Log in to edit, add, or remove family members.
                </p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            ref={emailRef}
                            placeholder="admin@family.local"
                            autoFocus
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            ref={passRef}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <div className="form-error-box">{error}</div>}
                    <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                        <LogIn size={16} />
                        {loading ? 'Signing in…' : 'Sign in as Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
}
