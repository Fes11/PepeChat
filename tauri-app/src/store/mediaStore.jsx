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

  volume = 1;

  constructor() {
    makeAutoObservable(this);
  }

  async loadDevices() {
    const devices = await mediaService.getDevices();

    this.microphones = devices.microphones;
    this.cameras = devices.cameras;
    this.speakers = devices.speakers;
  }

  changeMicrophone(target) {
    this.setMicrophone(target);
  }

  setMicrophone(id) {
    this.selectedMicrophone = id;
    localStorage.setItem("microphone", id);
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
  }

  changeVolume(value) {
    if (!Number.isFinite(value)) return;

    this.volume = Math.min(2, Math.max(0, value));
    localStorage.setItem("volume", String(this.volume));
  }
}

export default MediaStore;
