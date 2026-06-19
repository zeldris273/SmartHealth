import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Bắt buộc để trình duyệt tự gửi HttpOnly cookie (refresh_token) khi request
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Bỏ qua nếu là request đăng nhập, đăng ký hoặc refresh token
      const isAuthRequest = 
        originalRequest.url.includes('/auth/login') || 
        originalRequest.url.includes('/auth/google-login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/refresh');

      if (isAuthRequest) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Không cần gửi body — refresh_token nằm trong HttpOnly cookie, trình duyệt tự gửi
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = res.data;

        // Lưu access_token mới vào storage (access_token KHÔNG phải HttpOnly)
        if (localStorage.getItem('access_token')) {
          localStorage.setItem('access_token', access_token);
        } else {
          sessionStorage.setItem('access_token', access_token);
        }

        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_profile');
        sessionStorage.removeItem('access_token');
        if (window.location.pathname !== '/') {
          window.location.href = '/?openLogin=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
