import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout handler (defined early so checkLoggedInUser can safely reference it)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Restore authenticated session on app load
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Immediately set user from localStorage for fast initial render
          setUser(JSON.parse(storedUser));
          
          // Verify with backend
          const res = await API.get('/auth/me');
          const freshUserData = res.data.data || res.data;
          
          setUser(freshUserData);
          localStorage.setItem('user', JSON.stringify(freshUserData));
        } catch (error) {
          console.error('Session expired or invalid token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkLoggedInUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const responseData = res.data.data || res.data;
    
    // Extract token separately from user profile object
    const { token, ...userData } = responseData;

    if (token) {
      localStorage.setItem('token', token);
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  // Register handler
  const register = async (formData) => {
    const res = await API.post('/auth/register', formData);
    const responseData = res.data.data || res.data;
    
    const { token, ...userData } = responseData;

    if (token) {
      localStorage.setItem('token', token);
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};