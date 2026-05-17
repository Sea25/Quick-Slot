import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem('quickslot_user');
    localStorage.removeItem('quickslot_user_id');
  }, []);

  const login = useCallback((userData) => {
    if (!userData?.id) {
      console.error('Login response missing user id');
      return;
    }
    setUser(userData);
    localStorage.setItem('quickslot_user', JSON.stringify(userData));
    localStorage.setItem('quickslot_user_id', userData.id);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const stored = localStorage.getItem('quickslot_user');
      const storedId = localStorage.getItem('quickslot_user_id');

      if (!stored || !storedId) {
        setLoading(false);
        return;
      }

      try {
        const { valid, user: freshUser } = await api.verifySession();
        if (valid && freshUser) {
          login(freshUser);
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [clearSession, login]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
