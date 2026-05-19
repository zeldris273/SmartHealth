import { createContext, useState, useEffect, useContext } from 'react';
import { loginAPI, registerAPI, getProfileAPI } from '../services/auth';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState('login'); // 'login' or 'register'

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
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userProfile = await getProfileAPI();
          if (mounted) {
            setUser(userProfile);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('token');
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, []);

  const login = async (credentials, rememberMe) => {
    setIsLoading(true);
    try {
      const data = await loginAPI(credentials);
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        const userProfile = await getProfileAPI();
        setUser(userProfile);
        setIsAuthenticated(true);
        toast.success('Successfully logged in!');
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Login Error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
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
        password: userData.password
      });
      if (data.id) {
        toast.success('Successfully registered!');
        return await login({ email: userData.email, password: userData.password });
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Register Error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated, isLoading, login, register, logout,
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
