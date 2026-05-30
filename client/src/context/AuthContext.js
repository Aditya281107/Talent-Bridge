import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('tb_token'));

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('tb_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe(storedToken);
      setUser(res.data);
      setToken(storedToken);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('tb_token', newToken);
    localStorage.setItem('tb_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    const { token: newToken, ...userData } = res.data;
    localStorage.setItem('tb_token', newToken);
    localStorage.setItem('tb_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('tb_token');
    localStorage.removeItem('tb_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    localStorage.setItem('tb_user', JSON.stringify({ ...user, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isSeeker: user?.role === 'seeker',
        isEmployer: user?.role === 'employer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
