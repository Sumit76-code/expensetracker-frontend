// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('mm_token') || null);
  const [loading, setLoading] = useState(true); // true while verifying token on mount

  /* ── Verify token on first load ── */
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await api.get('/auth/me');      // GET /api/auth/me
        setUser(res.data.user);
      } catch {
        // Token invalid / expired — clear it
        localStorage.removeItem('mm_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  /* ── Register ── */
  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('mm_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('mm_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    localStorage.removeItem('mm_token');
    setToken(null);
    setUser(null);
  }, []);

  /* ── Update user in state (after profile edit) ── */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  /* ── Forgot Password — sends reset code to email ── */
  // POST /api/auth/forgot-password  →  { email }
  // Backend should email a reset code and optionally return { code } in dev mode
  const forgotPassword = useCallback(async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    // If your backend returns the code in dev mode, return it so the UI can
    // auto-fill for testing. In production the backend sends it via email only.
    return res.data?.code ?? null;
  }, []);

  /* ── Reset Password — verifies code and sets new password ── */
  // POST /api/auth/reset-password  →  { email, code, newPassword }
  const resetPassword = useCallback(async (email, code, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, code, newPassword });
    return res.data;
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* ── Hook ── */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;