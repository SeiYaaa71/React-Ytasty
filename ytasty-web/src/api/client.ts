import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginCall = requestUrl.includes('/auth/login');

    // Un 401 sur /auth/login signifie « mauvais identifiants » : il doit
    // remonter au formulaire, pas déclencher une redirection en boucle.
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  },
);
