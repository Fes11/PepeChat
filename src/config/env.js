const trimTrailingSlash = (value) => value.replace(/\/+$/, "");
const viteEnv = import.meta.env ?? {};

export const API_BASE_URL = trimTrailingSlash(
  viteEnv.VITE_API_URL || "http://localhost:8000",
);

export const WS_BASE_URL = trimTrailingSlash(
  viteEnv.VITE_WS_URL || "ws://localhost:8000",
);
