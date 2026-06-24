import api from './axios';

export const loginAPI = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data; // backend returns { access_token, token_type }
  } catch (error) {
    throw error.response?.data || new Error('Login failed');
  }
};

export const registerAPI = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data; // backend returns UserResponse
  } catch (error) {
    throw error.response?.data || new Error('Registration failed');
  }
};

export const sendOtpAPI = async ({ email, purpose = 'register' }) => {
  try {
    const response = await api.post('/otp/send', { email, purpose });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to send OTP');
  }
};

export const getProfileAPI = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data; // backend returns UserResponse
  } catch (error) {
    throw error.response?.data || new Error('Failed to fetch profile');
  }
};

export const updateProfileAPI = async (profileData) => {
  try {
    const response = await api.patch('/users/me', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to update profile');
  }
};

export const googleOAuthLogin = () => {
  // Redirect user to backend Google OAuth flow. The backend will handle redirect and cookie setting.
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/google/login`;
};

// Keep existing googleLoginAPI for backward compatibility (may be deprecated)
export const googleLoginAPI = async (googleToken) => {
  try {
    const response = await api.post('/auth/google-login', { token: googleToken });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Google login failed');
  }
};

export const logoutAPI = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Logout failed');
  }
};

export const forgotPasswordAPI = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to send password reset email');
  }
};

export const verifyResetOtpAPI = async ({ email, otp_code }) => {
  try {
    const response = await api.post('/auth/verify-reset-otp', { email, otp_code });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to verify OTP');
  }
};

export const resetPasswordAPI = async ({ email, otp_code, new_password }) => {
  try {
    const response = await api.post('/auth/reset-password', { email, otp_code, new_password });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to reset password');
  }
};

export const changePasswordAPI = async ({ current_password, new_password }) => {
  try {
    const response = await api.post('/auth/change-password', { current_password, new_password });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to change password');
  }
};
