import { createContext, useState, useEffect, useContext } from 'react';
import { loginAPI, registerAPI, getProfileAPI, updateProfileAPI } from '../services/auth';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState('login'); // 'login' or 'register'

  const getStoredToken = () => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  };

  const saveToken = (token, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem('access_token', token);
      sessionStorage.removeItem('access_token');
    } else {
      sessionStorage.setItem('access_token', token);
      localStorage.removeItem('access_token');
    }
  };

  const clearStoredTokens = () => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
  };

  const openAuthModal = (type = 'login') => {
    setAuthModalType(type);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const toggleAuthModalType = () => {
    setAuthModalType(prev => prev === 'login' ? 'register' : 'login');
  };

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      // If token exists, we don't need to re-save it here as it would default to localStorage
      // We just need to verify it's valid

      try {
        const userProfile = await getProfileAPI();
        if (mounted && userProfile?.id) {
          setUser(userProfile);
          setIsAuthenticated(true);
        } else {
          clearStoredTokens();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        clearStoredTokens();
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, []);

  const login = async (credentials, rememberMe = false) => {
    setIsLoading(true);
    try {
      const data = await loginAPI(credentials);
      const token = data?.access_token || data?.token;

      if (!token) {
        throw new Error('Login response did not include an access token');
      }

      saveToken(token, rememberMe);
      const userProfile = await getProfileAPI();

      if (!userProfile?.id) {
        throw new Error('Failed to fetch user profile after login');
      }

      setUser(userProfile);
      setIsAuthenticated(true);
      toast.success('Successfully logged in!');
      return { success: true };
    } catch (error) {
      console.error('Login Error:', error);
      clearStoredTokens();
      const errorMessage = error?.detail || error?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const data = await registerAPI({
        full_name: userData.fullName,
        email: userData.email,
        password: userData.password,
        otp: userData.otp
      });

      if (!data?.id) {
        throw new Error('Invalid response from server');
      }

      toast.success('Registration successful! Please log in with your credentials.');
      return { success: true };
    } catch (error) {
      console.error('Register Error:', error);
      const errorMessage = error?.detail || error?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredTokens();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    setIsLoading(true);
    try {
      const updatedData = await updateProfileAPI(profileData);
      setUser(updatedData);
      
      toast.success('Profile updated successfully!');
      return { success: true, user: updatedData };
    } catch (error) {
      console.error('Update Profile Error:', error);
      const errorMessage = error.detail || error.message || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated, isLoading, login, register, logout, updateProfile,
      isAuthModalOpen, authModalType, openAuthModal, closeAuthModal, toggleAuthModalType
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
