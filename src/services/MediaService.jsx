export const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  autoGainControl: true,
  noiseSuppression: true,
};

export const DEFAULT_VIDEO_CONSTRAINTS = {
  width: { min: 600, ideal: 1280 }, // Минимальная и идеальная ширина видео
  height: { min: 400, ideal: 720 }, // Минимальная и идеальная высота видео
  frameRate: { ideal: 30 }, // Идеальная частота кадров
};

export const ADDITIONAL_VIDEO_CONSTRAINTS = {
  displaySurface: "window",
  cursor: "motion",
};

export const mediaService = {
  async getMedia(constraints) {},

  async getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      microphones: devices.filter((d) => d.kind === "audioinput"),
      cameras: devices.filter((d) => d.kind === "videoinput"),
      speakers: devices.filter((d) => d.kind === "audiooutput"),
    };
  },

  async getMicrophone(deviceId) {
    return navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId, ...DEFAULT_AUDIO_CONSTRAINTS },
    });
  },

  async turnOffMicrophone(peerConnection) {
    // Получаем треки из потока
    const tracks = peerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "audio");
    if (tracks) {
      // Отключаем микрофон
      tracks.track.enabled = false;
    }
  },

  async turnOnMicrophone(peerConnection) {
    // Получаем треки из потока
    const tracks = peerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "audio");
    if (tracks) {
      // Включаем микрофон
      tracks.track.enabled = true;
    }
  },

  async testMicrophone(deviceId) {
    const stream = await mediaService.getMicrophone(deviceId);
    return stream;
  },

  async stopTestMicrophone(stream) {
    if (stream) {
      mediaService.stopStream(stream);
    }
  },

  stopStream(stream) {
    stream.getTracks().forEach((track) => track.stop());
  },
};
