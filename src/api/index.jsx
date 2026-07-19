import axios from "axios";
import { notifyError } from "../notifications/notificationService";
import { API_BASE_URL } from "../config/env";

export const BASE_URL = API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если 401 и не повторная попытка
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem("refresh");
      
      // Нет refresh токена - редирект
      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }
      
      // Если уже идет обновление, ждем его
      try {
        const newToken = await refreshAccessToken(refreshToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (!originalRequest?.skipErrorNotification) {
      notifyError(error);
    }

    return Promise.reject(error);
  }
);

// Функция обновления токена
export async function refreshAccessToken(
  refreshToken = localStorage.getItem("refresh"),
) {
  if (!refreshToken) {
    throw new Error("Refresh token is missing");
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await axios.post(`${BASE_URL}/api/users/token/refresh/`, {
      refresh: refreshToken,
    });

    const newToken = response.data.access;
    localStorage.setItem("token", newToken);
    if (response.data.refresh) {
      localStorage.setItem("refresh", response.data.refresh);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// Функция редиректа на логин
export function redirectToLogin() {
  console.log("Redirecting to login page");
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  delete api.defaults.headers.common['Authorization'];
  
  // Проверяем, что мы не уже на странице логина
  if (!window.location.pathname.includes('/login')) {
    window.location.href = "/login";
  }
}

export default api;
