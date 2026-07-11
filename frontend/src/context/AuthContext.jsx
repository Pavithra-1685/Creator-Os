import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'creatoros_access_token';
const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const parseJwt = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (token) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.user) {
          setUser(result.data.user);
          return result.data.user;
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
    return null;
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const payload = parseJwt(token);
        if (payload?.userId) {
          setUser({ id: payload.userId, email: payload.email });
        }
        await fetchProfile(token);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    const payload = parseJwt(token);
    if (payload?.userId) {
      setUser({ id: payload.userId, email: payload.email });
    }
    await fetchProfile(token);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, isLoading, fetchProfile }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
