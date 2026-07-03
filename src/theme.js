import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "app-theme";
const MAIN_COLOR_STORAGE_KEY = "main-color";

export const DEFAULT_THEME = "dark";
export const DEFAULT_MAIN_COLOR = "#7b61ff";
export const ACCENT_COLORS = [
  "#7b61ff",
  "#2f80ed",
  "#00a878",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

const isHexColor = (color) => /^#[0-9a-f]{6}$/i.test(color);

const normalizeHexColor = (color) => {
  if (!color) {
    return DEFAULT_MAIN_COLOR;
  }

  const normalizedColor = color.trim().toLowerCase();

  if (/^#[0-9a-f]{3}$/i.test(normalizedColor)) {
    const [, r, g, b] = normalizedColor;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return isHexColor(normalizedColor) ? normalizedColor : DEFAULT_MAIN_COLOR;
};

const hexToRgb = (hex) => {
  const normalizedHex = normalizeHexColor(hex).slice(1);
  const value = Number.parseInt(normalizedHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const mixColors = (baseColor, mixColor, weight) => {
  const base = hexToRgb(baseColor);
  const mix = hexToRgb(mixColor);
  const amount = Math.min(Math.max(weight, 0), 1);

  return rgbToHex({
    r: base.r * (1 - amount) + mix.r * amount,
    g: base.g * (1 - amount) + mix.g * amount,
    b: base.b * (1 - amount) + mix.b * amount,
  });
};

const getContrastColor = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#17181b" : "#ffffff";
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getTheme = (theme) => (theme === "light" ? "light" : DEFAULT_THEME);

const getSavedTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return getTheme(savedTheme);
};

export const getSavedThemeSettings = () => ({
  theme: getSavedTheme(),
  mainColor: normalizeHexColor(localStorage.getItem(MAIN_COLOR_STORAGE_KEY)),
});

export const applyThemeSettings = ({ theme, mainColor }) => {
  const root = document.documentElement;
  const nextTheme = getTheme(theme);
  const nextMainColor = normalizeHexColor(mainColor);
  const contrastColor = getContrastColor(nextMainColor);
  const hoverMixColor = nextTheme === "light" ? "#000000" : "#ffffff";
  const chatInputBg =
    nextTheme === "light"
      ? `linear-gradient(to right, rgba(255, 255, 255, 0.82), ${mixColors(
          nextMainColor,
          "#ffffff",
          0.9,
        )})`
      : `linear-gradient(to right, rgba(58, 58, 64, 0.35), ${withAlpha(
          nextMainColor,
          0.14,
        )})`;

  root.dataset.theme = nextTheme;
  root.style.setProperty("--main-color", nextMainColor);
  root.style.setProperty(
    "--main-hover-color",
    mixColors(nextMainColor, hoverMixColor, 0.16),
  );
  root.style.setProperty(
    "--main-contrast-color",
    contrastColor,
  );
  root.style.setProperty("--main-soft-color", withAlpha(nextMainColor, 0.28));
  root.style.setProperty("--main-faint-color", withAlpha(nextMainColor, 0.16));
  root.style.setProperty(
    "--message-time-color",
    withAlpha(contrastColor, 0.72),
  );
  root.style.setProperty("--chat-input-bg", chatInputBg);
};

export const saveThemeSettings = ({ theme, mainColor }) => {
  localStorage.setItem(THEME_STORAGE_KEY, getTheme(theme));
  localStorage.setItem(MAIN_COLOR_STORAGE_KEY, normalizeHexColor(mainColor));
};

export const initThemeSettings = () => {
  applyThemeSettings(getSavedThemeSettings());
};

export const useThemeSettings = () => {
  const [settings, setSettings] = useState(getSavedThemeSettings);

  useEffect(() => {
    applyThemeSettings(settings);
    saveThemeSettings(settings);
  }, [settings]);

  const setTheme = (theme) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      theme: getTheme(theme),
    }));
  };

  const setMainColor = (mainColor) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      mainColor: normalizeHexColor(mainColor),
    }));
  };

  return {
    ...settings,
    setTheme,
    setMainColor,
  };
};
