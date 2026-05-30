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

export const googleLoginAPI = async (googleToken) => {
  try {
    const response = await api.post('/auth/google-login', { token: googleToken });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Google login failed');
  }
};
