import { createContext, useContext, useState, useCallback } from 'react';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const SESSION_KEY = 'relationtree_admin_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(() => {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    });

    const login = useCallback((email, password) => {
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            sessionStorage.setItem(SESSION_KEY, 'true');
            setIsAdmin(true);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setIsAdmin(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
