import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api/authApi';
import { setLogoutHandler, getAccessToken } from '../services/api/axiosInstance';
import { socketService } from '../services/socket/socketClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      socketService.disconnect();
    }
  }, []);

  const initAuth = useCallback(async () => {
    try {
      // Attempt silent refresh via HttpOnly cookie
      const refreshRes = await authApi.refreshToken();
      if (refreshRes?.data?.user) {
        setUser(refreshRes.data.user);
        socketService.connect();
      } else {
        const me = await authApi.getMe();
        if (me) {
          setUser(me);
          socketService.connect();
        }
      }
    } catch {
      // User is not logged in / no refresh token
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
    initAuth();
  }, [initAuth, logout]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const loggedInUser = res?.data?.user;
    setUser(loggedInUser);
    socketService.connect();
    return loggedInUser;
  };

  const register = async (data) => {
    return await authApi.register(data);
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: Boolean(user && getAccessToken()),
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
