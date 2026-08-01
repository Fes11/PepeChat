import { API_BASE_URL } from "../config/env.js";

const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const STORAGE_PATH_PREFIXES = ["user_avatars/", "chat_avatars/"];
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, "");

const joinApiUrl = (apiBaseUrl, path) => {
  const normalizedBase = apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "").replace(/\/{2,}/g, "/");

  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;
};

const normalizeRelativeMediaPath = (path) => {
  const withoutLeadingDots = path.replace(/^(\.\/)+/, "");
  const normalizedPath = trimSlashes(withoutLeadingDots);

  if (STORAGE_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return `media/${normalizedPath}`;
  }

  return normalizedPath;
};

export const resolveMediaUrlFromBase = (url, apiBaseUrl) => {
  if (typeof url !== "string") return null;

  const value = url.trim();
  if (!value) return null;

  if (!apiBaseUrl || typeof apiBaseUrl !== "string") return value;

  const normalizedBase = apiBaseUrl.replace(/\/+$/, "");
  let parsedBase;

  try {
    parsedBase = new URL(normalizedBase);
  } catch {
    return value;
  }

  if (value.startsWith("//") || ABSOLUTE_URL_PATTERN.test(value)) {
    let parsedUrl;

    try {
      parsedUrl = value.startsWith("//")
        ? new URL(`${parsedBase.protocol}${value}`)
        : new URL(value);
    } catch {
      return value;
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return value;
    }

    const pointsToConfiguredApi = parsedUrl.host === parsedBase.host;
    const pointsToLocalApi = LOCAL_API_HOSTS.has(parsedUrl.hostname);

    if (pointsToConfiguredApi || pointsToLocalApi) {
      const normalizedBasePath = trimSlashes(parsedBase.pathname);
      const normalizedUrlPath = trimSlashes(parsedUrl.pathname);
      const pathWithoutRepeatedBase =
        normalizedBasePath &&
        (normalizedUrlPath === normalizedBasePath ||
          normalizedUrlPath.startsWith(`${normalizedBasePath}/`))
          ? normalizedUrlPath.slice(normalizedBasePath.length)
          : normalizedUrlPath;

      return `${joinApiUrl(normalizedBase, pathWithoutRepeatedBase)}${parsedUrl.search}${parsedUrl.hash}`;
    }

    return value.startsWith("//") ? `${parsedBase.protocol}${value}` : value;
  }

  return joinApiUrl(normalizedBase, normalizeRelativeMediaPath(value));
};

export const resolveMediaUrl = (url) => {
  return resolveMediaUrlFromBase(url, API_BASE_URL);
};
