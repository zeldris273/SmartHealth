import { createContext, useState, useEffect, useContext } from 'react';
import { loginAPI, registerAPI, getProfileAPI, updateProfileAPI, googleLoginAPI, logoutAPI } from '../services/auth';
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
    // Chỉ lưu access_token — refresh_token nằm trong HttpOnly cookie (không cần JS xử lý)
    if (rememberMe) {
      localStorage.setItem('access_token', token);
      sessionStorage.removeItem('access_token');
    } else {
      sessionStorage.setItem('access_token', token);
      localStorage.removeItem('access_token');
    }
  };

  const clearStoredTokens = () => {
    // Chỉ xóa access_token — refresh_token (HttpOnly cookie) được xóa bởi backend qua /auth/logout
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

  const refreshProfile = async () => {
    try {
      console.log("Refreshing user profile...");
      const updatedUser = await getProfileAPI();
      console.log("Profile refreshed:", updatedUser);
      if (updatedUser?.id) {
        setUser(updatedUser);
        // Cache the updated profile
        localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
      // Silently fail - just log the error without showing toast
    }
  };

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const token = getStoredToken();
      console.log('Initializing auth with token:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('No token found - clearing auth state');
        if (mounted) setIsLoading(false);
        return;
      }

      // First, check if we have a stored profile in localStorage (to make it faster)
      const storedProfile = localStorage.getItem('user_profile');
      let hasValidStoredProfile = false;
      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile);
          if (parsedProfile?.id && mounted) {
            console.log('Using cached user profile');
            setUser(parsedProfile);
            setIsAuthenticated(true);
            hasValidStoredProfile = true;
          }
        } catch (e) {
          console.warn('Invalid stored profile');
        }
      }

      // Then try to validate token and get fresh profile from server
      try {
        console.log('Fetching fresh user profile...');
        const userProfile = await getProfileAPI();
        if (mounted && userProfile?.id) {
          console.log('Profile fetched successfully:', userProfile);
          setUser(userProfile);
          setIsAuthenticated(true);
          hasValidStoredProfile = true;
          // Cache the profile for faster loading next time
          localStorage.setItem('user_profile', JSON.stringify(userProfile));
        }
      } catch (error) {
        console.error('Failed to fetch fresh profile:', error);
        // Only clear tokens and logout if we get a 401 Unauthorized (token invalid/expired)
        if (error?.response?.status === 401) {
          console.log('Token invalid/expired - clearing auth state');
          clearStoredTokens();
          localStorage.removeItem('user_profile');
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
            hasValidStoredProfile = false;
          }
        } else if (!hasValidStoredProfile) {
          // If no cached profile either, clear everything
          clearStoredTokens();
          localStorage.removeItem('user_profile');
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
        // Otherwise: keep cached profile and logged in state
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => { mounted = false; };
  }, []);

  // Polling để cập nhật trạng thái online mỗi 1 phút
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollProfile = async () => {
      try {
        await refreshProfile();
      } catch (error) {
        console.error("Failed to poll profile:", error);
      }
    };

    const intervalId = setInterval(pollProfile, 10000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshProfile]);

  const login = async (credentials, rememberMe = false) => {
    console.log('Login function called with rememberMe:', rememberMe);
    setIsLoading(true);
    try {
      console.log('Calling login API with credentials:', credentials);
      const data = await loginAPI(credentials);
      console.log('Login API response:', data);
      const token = data?.access_token || data?.token;
      const refreshToken = data?.refresh_token;

      if (!token) {
        throw new Error('Login response did not include an access token');
      }

      console.log('Token received, saving...');
      saveToken(token, rememberMe);
      console.log('Fetching user profile...');
      const userProfile = await getProfileAPI();
      console.log('User profile received:', userProfile);

      if (!userProfile?.id) {
        throw new Error('Failed to fetch user profile after login');
      }

      setUser(userProfile);
      setIsAuthenticated(true);
      // Cache user profile
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      toast.success('Successfully logged in!');
      return { success: true };
    } catch (error) {
      console.error('Login Error:', error);
      clearStoredTokens();
      localStorage.removeItem('user_profile');
      const errorMessage = error?.detail || error?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Google login handling
  const googleLogin = async (googleToken, rememberMe = false) => {
    console.log('Google login invoked');
    setIsLoading(true);
    try {
      const data = await googleLoginAPI(googleToken);
      console.log('Google login API response:', data);
      const token = data?.access_token || data?.token;
      const refreshToken = data?.refresh_token;
      if (!token) {
        throw new Error('Google login response missing access token');
      }
      // Save token similar to normal login (refresh_token already set in HttpOnly cookie by backend)
      saveToken(token, rememberMe);
      const userProfile = await getProfileAPI();
      console.log('User profile after Google login:', userProfile);
      if (!userProfile?.id) {
        throw new Error('Failed to fetch user profile after Google login');
      }
      setUser(userProfile);
      setIsAuthenticated(true);
      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      
      // Refresh profile to make sure we get the latest avatar_url
      await refreshProfile();
      
      toast.success('Successfully logged in with Google!');
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      clearStoredTokens();
      localStorage.removeItem('user_profile');
      const errMsg = error?.detail || error?.message || 'Google login failed';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      // Tạo full_name mặc định từ phần trước @ của email
      const defaultFullName = userData.email.split('@')[0];
      const data = await registerAPI({
        full_name: defaultFullName,
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
      // Hiển thị chi tiết lỗi từ backend (nếu là mảng)
      let errorMessage = 'Registration failed';
      if (error?.detail) {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail.map(d => `${d.loc?.[1] || 'field'}: ${d.msg}`).join('\n');
        } else {
          errorMessage = error.detail;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Gọi backend để xóa HttpOnly cookie (refresh_token)
    try {
      await logoutAPI();
    } catch (e) {
      // Bỏ qua lỗi — vẫn tiến hành đăng xuất phía client
      console.warn('Logout API error (ignored):', e);
    }
    clearStoredTokens();
    localStorage.removeItem('user_profile');
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
      user, isAuthenticated, isLoading, login, register, logout, updateProfile, refreshProfile, googleLogin,
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
