import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ft_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ft_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
