import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SESSION_KEY = 'relationtree_admin_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY) || null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!token) {
            setIsAdmin(false);
            setIsChecking(false);
            return;
        }

        // Verify token with server
        fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setIsAdmin(true);
                } else {
                    sessionStorage.removeItem(SESSION_KEY);
                    setToken(null);
                    setIsAdmin(false);
                }
            })
            .catch(() => {
                // Error connecting, log them out for safety
                setIsAdmin(false);
            })
            .finally(() => setIsChecking(false));
    }, [token]);

    const login = useCallback(async (email, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success && data.token) {
                sessionStorage.setItem(SESSION_KEY, data.token);
                setToken(data.token);
                setIsAdmin(true);
                return true;
            }
        } catch (error) {
            console.error('Login error', error);
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setToken(null);
        setIsAdmin(false);
    }, []);

    // Provide token to context so other parts of the app can use it for requests
    return (
        <AuthContext.Provider value={{ isAdmin, login, logout, isChecking, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
