import axios from 'axios';
import { API_BASE_URL, withAppBase } from '@/lib/runtime-config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.assign(withAppBase('/login'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
