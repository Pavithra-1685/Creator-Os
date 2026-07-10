import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'creatoros_access_token';
const AuthContext = createContext(null);

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

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const payload = parseJwt(token);
    if (payload?.userId) {
      setUser({ id: payload.userId, email: payload.email });
    }
    setIsLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    const payload = parseJwt(token);
    if (payload?.userId) {
      setUser({ id: payload.userId, email: payload.email });
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, isLoading }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
