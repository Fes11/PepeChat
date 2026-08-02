export const DEFAULT_MICROPHONE_SETTINGS = Object.freeze({
  volume: 1,
  autoGainControl: false,
  noiseSuppressionMode: "strong",
  noiseGateEnabled: true,
  noiseGateThreshold: 0.04,
});

export const HOT_AUDIO_SETTING_KEYS = Object.freeze([
  "volume",
  "noiseGateEnabled",
  "noiseGateThreshold",
]);

export const isHotAudioSettingsChange = (changedKeys = []) =>
  changedKeys.length > 0 &&
  changedKeys.every((key) => HOT_AUDIO_SETTING_KEYS.includes(key));
