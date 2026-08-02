import { makeAutoObservable } from "mobx";
import { mediaService } from "../services/MediaService";
import { DEFAULT_MICROPHONE_SETTINGS } from "../constants/audioSettings";

class MediaStore {
  microphones = [];
  cameras = [];
  speakers = [];

  audioStream = null;
  videoStream = null;

  selectedMicrophone = null;
  selectedCamera = null;
  selectedDisplay = null;
  permissionRequested = false;

  volume = DEFAULT_MICROPHONE_SETTINGS.volume;
  autoGainControl = DEFAULT_MICROPHONE_SETTINGS.autoGainControl;
  noiseSuppressionMode = DEFAULT_MICROPHONE_SETTINGS.noiseSuppressionMode;
  noiseGateEnabled = DEFAULT_MICROPHONE_SETTINGS.noiseGateEnabled;
  noiseGateThreshold = DEFAULT_MICROPHONE_SETTINGS.noiseGateThreshold;

  constructor() {
    makeAutoObservable(this);
  }

  async loadDevices() {
    const devices = await mediaService.getDevices();

    this.microphones = devices.microphones;
    this.cameras = devices.cameras;
    this.speakers = devices.speakers;
  }

  async initializeDevices({ requestMicrophone = false } = {}) {
    this.loadSavedDevices();

    if (requestMicrophone && !this.permissionRequested) {
      this.permissionRequested = true;

      try {
        await mediaService.ensureMicrophonePermission();
      } catch (err) {
        console.warn("[MediaStore] Microphone permission was not granted", err);
      }
    }

    await this.loadDevices();
  }

  changeMicrophone(target) {
    this.setMicrophone(target);
  }

  setMicrophone(id) {
    this.selectedMicrophone = id;
    localStorage.setItem("microphone", id);
    window.dispatchEvent(
      new CustomEvent("pepechat:microphonechange", {
        detail: { deviceId: id },
      }),
    );
  }

  emitAudioSettingsChange(changedKeys = []) {
    window.dispatchEvent(
      new CustomEvent("pepechat:audiosettingschange", {
        detail: { settings: this.getAudioSettings(), changedKeys },
      }),
    );
  }

  getAudioSettings() {
    return {
      volume: this.volume,
      autoGainControl: this.autoGainControl,
      noiseSuppressionMode: this.noiseSuppressionMode,
      noiseGateEnabled: this.noiseGateEnabled,
      noiseGateThreshold: this.noiseGateThreshold,
    };
  }

  setCamera(id) {
    this.selectedCamera = id;
    localStorage.setItem("camera", id);
    window.dispatchEvent(
      new CustomEvent("pepechat:camerachange", {
        detail: { deviceId: id },
      }),
    );
  }

  setDisplay(id) {
    this.selectedDisplay = id;
    localStorage.setItem("speaker", id);
  }

  loadSavedDevices() {
    this.selectedMicrophone = localStorage.getItem("microphone");
    this.selectedCamera = localStorage.getItem("camera");
    this.selectedDisplay = localStorage.getItem("speaker");
    const savedVolumeValue = localStorage.getItem("volume");
    const savedVolume = Number(savedVolumeValue);
    if (savedVolumeValue !== null && Number.isFinite(savedVolume)) {
      this.volume = Math.min(2, Math.max(0, savedVolume));
    }

    const savedAutoGainControl = localStorage.getItem("autoGainControl");
    if (savedAutoGainControl !== null) {
      this.autoGainControl = savedAutoGainControl === "true";
    }

    const savedNoiseSuppressionMode = localStorage.getItem(
      "noiseSuppressionMode",
    );
    if (["off", "light", "strong"].includes(savedNoiseSuppressionMode)) {
      this.noiseSuppressionMode = savedNoiseSuppressionMode;
    }

    const savedNoiseGateEnabled = localStorage.getItem("noiseGateEnabled");
    if (savedNoiseGateEnabled !== null) {
      this.noiseGateEnabled = savedNoiseGateEnabled === "true";
    }

    const savedNoiseGateThresholdValue = localStorage.getItem(
      "noiseGateThreshold",
    );
    const savedNoiseGateThreshold = Number(savedNoiseGateThresholdValue);
    if (
      savedNoiseGateThresholdValue !== null &&
      Number.isFinite(savedNoiseGateThreshold)
    ) {
      this.noiseGateThreshold = Math.min(
        0.08,
        Math.max(0.005, savedNoiseGateThreshold),
      );
    }
  }

  changeVolume(value) {
    if (!Number.isFinite(value)) return;

    const nextVolume = Math.min(2, Math.max(0, value));
    if (nextVolume === this.volume) return;
    this.volume = nextVolume;
    localStorage.setItem("volume", String(this.volume));
    this.emitAudioSettingsChange(["volume"]);
  }

  changeAutoGainControl(enabled) {
    const nextEnabled = Boolean(enabled);
    if (nextEnabled === this.autoGainControl) return;
    this.autoGainControl = nextEnabled;
    localStorage.setItem("autoGainControl", String(this.autoGainControl));
    this.emitAudioSettingsChange(["autoGainControl"]);
  }

  changeNoiseSuppressionMode(mode) {
    if (!["off", "light", "strong"].includes(mode)) return;

    if (mode === this.noiseSuppressionMode) return;
    this.noiseSuppressionMode = mode;
    localStorage.setItem("noiseSuppressionMode", mode);
    this.emitAudioSettingsChange(["noiseSuppressionMode"]);
  }

  changeNoiseGateEnabled(enabled) {
    const nextEnabled = Boolean(enabled);
    if (nextEnabled === this.noiseGateEnabled) return;
    this.noiseGateEnabled = nextEnabled;
    localStorage.setItem("noiseGateEnabled", String(this.noiseGateEnabled));
    this.emitAudioSettingsChange(["noiseGateEnabled"]);
  }

  changeNoiseGateThreshold(value) {
    if (!Number.isFinite(value)) return;

    const nextThreshold = Math.min(0.08, Math.max(0.005, value));
    if (nextThreshold === this.noiseGateThreshold) return;
    this.noiseGateThreshold = nextThreshold;
    localStorage.setItem(
      "noiseGateThreshold",
      String(this.noiseGateThreshold),
    );
    this.emitAudioSettingsChange(["noiseGateThreshold"]);
  }

  resetAudioSettings() {
    this.volume = DEFAULT_MICROPHONE_SETTINGS.volume;
    this.autoGainControl = DEFAULT_MICROPHONE_SETTINGS.autoGainControl;
    this.noiseSuppressionMode =
      DEFAULT_MICROPHONE_SETTINGS.noiseSuppressionMode;
    this.noiseGateEnabled = DEFAULT_MICROPHONE_SETTINGS.noiseGateEnabled;
    this.noiseGateThreshold =
      DEFAULT_MICROPHONE_SETTINGS.noiseGateThreshold;

    Object.entries(DEFAULT_MICROPHONE_SETTINGS).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });
    this.emitAudioSettingsChange(Object.keys(DEFAULT_MICROPHONE_SETTINGS));
  }
}

export default MediaStore;
