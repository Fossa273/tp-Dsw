/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'rutabus_user';

// The administrator account is identified by a fixed email. It is not based
// on the id (0) because MySQL/BariaDB AUTO_INCREMENT columns can reassign an
// explicit 0 to another value, making the id unreliable.
export const ADMIN_EMAIL = 'admin@rutabus.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // The administrator is the account with the fixed admin email
  const isAdmin = useMemo(
    () =>
      user !== null &&
      !!user.email &&
      String(user.email).trim().toLowerCase() === ADMIN_EMAIL,
    [user]
  );

  const saveUser = (data) => {
    setUser(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    saveUser(res.data);
    return res.data;
  };

  const register = async (client) => {
    return await api.clients.create(client);
  };

  const resetPassword = async (email, password) => {
    return await api.auth.resetPassword(email, password);
  };

  const logout = async () => {
    if (user) {
      try {
        await api.auth.logout(user.id);
      } catch {
        // even if the backend fails, close the local session
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Refresh the logged user data (after editing the profile)
  const updateUser = (data) => {
    setUser((prev) => {
      const merged = { ...prev, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    isAdmin,
    login,
    register,
    logout,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}