export const DEFAULT_SCREEN_SHARE_QUALITY = "standard";

export const SCREEN_SHARE_QUALITY_STORAGE_KEY =
  "pepechat:screen-share-quality";

export const SCREEN_SHARE_QUALITY_OPTIONS = [
  {
    id: "economy",
    label: "Экономное",
    summary: "720p · 15 FPS",
    description: "Для нестабильной сети",
    width: 1280,
    height: 720,
    frameRate: 15,
    maxBitrate: 1_500_000,
    contentHint: "detail",
  },
  {
    id: "standard",
    label: "Стандартное",
    summary: "1080p · 30 FPS",
    description: "Баланс чёткости и плавности",
    width: 1920,
    height: 1080,
    frameRate: 30,
    maxBitrate: 5_000_000,
    contentHint: "detail",
  },
  {
    id: "detail",
    label: "Чёткий текст",
    summary: "1440p · 20 FPS",
    description: "Код, таблицы и мелкие детали",
    width: 2560,
    height: 1440,
    frameRate: 20,
    maxBitrate: 7_000_000,
    contentHint: "detail",
  },
  {
    id: "motion",
    label: "Плавное",
    summary: "1080p · 60 FPS",
    description: "Видео, анимация и игры",
    width: 1920,
    height: 1080,
    frameRate: 60,
    maxBitrate: 8_000_000,
    contentHint: "motion",
  },
  {
    id: "ultra",
    label: "Максимальное",
    summary: "4K · 30 FPS",
    description: "Требует стабильный upload",
    width: 3840,
    height: 2160,
    frameRate: 30,
    maxBitrate: 12_000_000,
    contentHint: "detail",
  },
];

export const getScreenShareQuality = (qualityId) =>
  SCREEN_SHARE_QUALITY_OPTIONS.find(({ id }) => id === qualityId) ??
  SCREEN_SHARE_QUALITY_OPTIONS.find(
    ({ id }) => id === DEFAULT_SCREEN_SHARE_QUALITY,
  );

export const normalizeScreenShareQuality = (qualityId) =>
  getScreenShareQuality(qualityId).id;
