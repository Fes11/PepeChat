const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || "http://localhost:8000",
);

export const WS_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_WS_URL || "ws://localhost:8000",
);
