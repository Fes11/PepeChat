import axios from "axios";

export const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ===== REQUEST =====
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== REFRESH LOGIC =====
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ===== RESPONSE =====
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // ждём завершения refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refresh = localStorage.getItem("refresh");

        const response = await axios.post(
          `${BASE_URL}/api/users/token/refresh/`,
          { refresh },
          { withCredentials: true },
        );

        const newAccess = response.data.access;
        localStorage.setItem("token", newAccess);

        api.defaults.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        console.log("Refresh Token");
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // ❗ здесь НЕТ AuthStore
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");

        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
