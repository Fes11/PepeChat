import { API_BASE_URL } from "../config/env";

const MEDIA_PATH_PREFIX = "/media/";
const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") return url;

  if (url.startsWith(MEDIA_PATH_PREFIX)) {
    return `${API_BASE_URL}${url}`;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.pathname.startsWith(MEDIA_PATH_PREFIX)
      && LOCAL_API_HOSTS.has(parsedUrl.hostname)
    ) {
      return `${API_BASE_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return url;
  }

  return url;
};
