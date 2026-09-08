import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authAPI } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const register = async (data) => {
    const response = await authAPI.register(data);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (data) => {
    const response = await authAPI.login(data);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await authAPI.updateProfile(data);
    setUser(response.data.user);
    return response.data;
  };

  const changePassword = async (data) => {
    const response = await authAPI.changePassword(data);
    setUser(response.data.user);
    return response.data;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
