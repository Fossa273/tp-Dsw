/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'rutabus_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // El administrador es el cliente con id 0
  const isAdmin = useMemo(
    () => user !== null && String(user.id) === '0',
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

  const register = async (cliente) => {
    return await api.clientes.create(cliente);
  };

  const resetPassword = async (email, password) => {
    return await api.auth.resetPassword(email, password);
  };

  const logout = async () => {
    if (user) {
      try {
        await api.auth.logout(user.id);
      } catch {
        // aunque falle el backend, cerramos la sesion local
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Refresca los datos del usuario logueado (tras editar su perfil)
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
