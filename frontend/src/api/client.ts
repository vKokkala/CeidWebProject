import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { getStoredToken, clearAuthState } from "../context/AuthContext";

const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach JWT token to all requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors (session expired)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      clearAuthState();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
