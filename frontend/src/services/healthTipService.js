import api from './api';

export const healthTipService = {
  getTodayTip: async () => {
    const response = await api.get('/health-tips/today');
    return response.data;
  },
  refreshTip: async () => {
    const response = await api.post('/health-tips/refresh');
    return response.data;
  }
};