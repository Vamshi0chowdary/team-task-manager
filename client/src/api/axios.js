import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || '';

    // If unauthorized and the request was NOT to the auth endpoints, force logout.
    if (status === 401 && !reqUrl.includes('/api/auth')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // For auth endpoints or other errors, don't force a redirect here; let callers handle it.
    // Improve error object for network errors (no response)
    if (!error.response) {
      error.message = error.message || 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
