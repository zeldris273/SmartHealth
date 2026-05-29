import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors gently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't automatically redirect on 401s - let AuthContext handle it
    if (error?.response?.status === 401) {
      console.log('401 Unauthorized error received');
    }
    return Promise.reject(error);
  }
);

export default api;
