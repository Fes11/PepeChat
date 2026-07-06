import { makeAutoObservable } from "mobx";
import { mediaService } from "../services/MediaService";

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

  volume = 1;
  autoGainControl = false;
  noiseSuppressionMode = "strong";
  noiseGateEnabled = true;
  noiseGateThreshold = 0.025;

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

  emitAudioSettingsChange() {
    window.dispatchEvent(
      new CustomEvent("pepechat:audiosettingschange", {
        detail: { settings: this.getAudioSettings() },
      }),
    );
  }

  getAudioSettings() {
    return {
      autoGainControl: this.autoGainControl,
      noiseSuppressionMode: this.noiseSuppressionMode,
      noiseGateEnabled: this.noiseGateEnabled,
      noiseGateThreshold: this.noiseGateThreshold,
    };
  }

  setCamera(id) {
    this.selectedCamera = id;
    localStorage.setItem("camera", id);
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

    this.volume = Math.min(2, Math.max(0, value));
    localStorage.setItem("volume", String(this.volume));
    this.emitAudioSettingsChange();
  }

  changeAutoGainControl(enabled) {
    this.autoGainControl = Boolean(enabled);
    localStorage.setItem("autoGainControl", String(this.autoGainControl));
    this.emitAudioSettingsChange();
  }

  changeNoiseSuppressionMode(mode) {
    if (!["off", "light", "strong"].includes(mode)) return;

    this.noiseSuppressionMode = mode;
    localStorage.setItem("noiseSuppressionMode", mode);
    this.emitAudioSettingsChange();
  }

  changeNoiseGateEnabled(enabled) {
    this.noiseGateEnabled = Boolean(enabled);
    localStorage.setItem("noiseGateEnabled", String(this.noiseGateEnabled));
    this.emitAudioSettingsChange();
  }

  changeNoiseGateThreshold(value) {
    if (!Number.isFinite(value)) return;

    this.noiseGateThreshold = Math.min(0.08, Math.max(0.005, value));
    localStorage.setItem(
      "noiseGateThreshold",
      String(this.noiseGateThreshold),
    );
    this.emitAudioSettingsChange();
  }
}

export default MediaStore;
