import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // Attempt silent refresh
      try {
        const refreshRes = await authApi.refreshToken();
        if (refreshRes.success) {
          const userRes = await authApi.getMe();
          if (userRes.success && userRes.user) {
            setUser(userRes.user);
            return;
          }
        }
      } catch {
        // Guest session
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, forceLogin = false) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password, forceLogin });
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async (credential, forceLogin = false) => {
    setError(null);
    try {
      const res = await authApi.loginWithGoogle(credential, forceLogin);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const registerPatient = async (data) => {
    setError(null);
    try {
      const res = await authApi.registerPatient(data);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const registerDoctor = async (data) => {
    setError(null);
    try {
      const res = await authApi.registerDoctor(data);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithOtp = async (email, otp, forceLogin = false) => {
    setError(null);
    try {
      const res = await authApi.verifyLoginOtp(email, otp, forceLogin);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const registerPatientWithOtp = async (data) => {
    setError(null);
    try {
      const res = await authApi.registerPatientWithOtp(data);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const sendOtp = async (email, purpose = 'login') => {
    return await authApi.sendOtp(email, purpose);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        loginWithOtp,
        sendOtp,
        registerPatient,
        registerPatientWithOtp,
        registerDoctor,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
