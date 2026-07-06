import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, getToken, setStoredUser, setToken, clearAuth } from '../../lib/authStorage';
import { UNAUTHORIZED_EVENT } from '../../api/client';
import { fetchCurrentUser, loginRequest } from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saklanan token'ı arka planda /auth/me ile doğrula; geçersizse
  // apiFetch 401 handler'ı UNAUTHORIZED_EVENT'i tetikleyip logout'u çağırır.
  useEffect(() => {
    if (!getToken()) return;
    fetchCurrentUser()
      .then((freshUser) => {
        setStoredUser(freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        // 401 zaten UNAUTHORIZED_EVENT ile ele alınıyor.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user: loggedInUser } = await loginRequest(email, password);
    setToken(accessToken);
    setStoredUser(loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  }
  return ctx;
}
