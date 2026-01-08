import axios from "axios";

export const BASE_URL = "http://localhost:8000";

const api = axios.create({
  withCredentials: true,
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._isRetry &&
      localStorage.getItem("refresh")
    ) {
      originalRequest._isRetry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        const response = await axios.post(
          `${BASE_URL}/api/users/token/refresh/`,
          { refresh },
          { withCredentials: true }
        );

        localStorage.setItem("token", response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (err) {
        store.logout();
      }
    }

    throw error;
  }
);

export default api;
