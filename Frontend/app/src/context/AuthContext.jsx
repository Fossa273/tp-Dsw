/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';
import { ADMIN_EMAIL } from '../utils/constants';

const AuthContext = createContext(null);

const STORAGE_KEY = 'rutabus_user';
const TOKEN_KEY = 'rutabus_token';

export { ADMIN_EMAIL };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAdmin = useMemo(
    () =>
      user !== null &&
      user?.role === 'admin' ||
      (!!user?.email && String(user.email).trim().toLowerCase() === ADMIN_EMAIL),
    [user]
  );

  const saveUser = useCallback((data) => {
    const { token, ...userData } = data;
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.auth.login(email, password);
    saveUser(res.data);
    return res.data;
  }, [saveUser]);

  const register = useCallback(async (client) => {
    return await api.clients.create(client);
  }, []);

  const resetPassword = useCallback(async (email, password) => {
    return await api.auth.resetPassword(email, password);
  }, []);

  const logout = useCallback(async () => {
    setUser((currentUser) => {
      if (currentUser) {
        api.auth.logout(currentUser.id).catch(() => {});
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    });
  }, []);

  const updateUser = useCallback((data) => {
    setUser((prev) => {
      const merged = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isAdmin,
    login,
    register,
    logout,
    resetPassword,
    updateUser,
  }), [user, isAdmin, login, register, logout, resetPassword, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}