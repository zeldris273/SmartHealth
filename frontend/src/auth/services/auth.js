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

export const getProfileAPI = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data; // backend returns UserResponse
  } catch (error) {
    throw error.response?.data || new Error('Failed to fetch profile');
  }
};
