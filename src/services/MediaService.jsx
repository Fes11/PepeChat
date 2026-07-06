import { audioProcessingService } from "./AudioProcessingService";

export const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
  sampleRate: 48000,
  sampleSize: 16,
  channelCount: 1,
  latency: { ideal: 0.02 },
  voiceIsolation: true,
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

  async ensureMicrophonePermission() {
    if (!navigator.mediaDevices?.getUserMedia) return false;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaService.stopStream(stream);
    return true;
  },

  async getDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return {
        microphones: [],
        cameras: [],
        speakers: [],
      };
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      microphones: devices.filter((d) => d.kind === "audioinput"),
      cameras: devices.filter((d) => d.kind === "videoinput"),
      speakers: devices.filter((d) => d.kind === "audiooutput"),
    };
  },

  async setAudioOutput(audioElement, deviceId) {
    if (!audioElement || !deviceId || !audioElement.setSinkId) return;

    try {
      await audioElement.setSinkId(deviceId);
    } catch (err) {
      console.warn("[MediaService] Cannot set audio output device", err);
    }
  },

  async getMicrophone(deviceId, options = {}) {
    const {
      processAudio = true,
      volume = 1,
      audioSettings = {},
    } = options;
    const noiseSuppressionMode =
      audioSettings.noiseSuppressionMode ?? "strong";
    const audioConstraints = {
      ...DEFAULT_AUDIO_CONSTRAINTS,
      autoGainControl: audioSettings.autoGainControl ?? false,
      noiseSuppression: noiseSuppressionMode !== "off",
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    };

    const rawStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });

    if (!processAudio) return rawStream;

    try {
      const processed = await audioProcessingService.createProcessedMicrophoneStream(
        rawStream,
        {
          volume,
          noiseSuppressionMode,
          noiseGateEnabled: audioSettings.noiseGateEnabled ?? true,
          noiseGateThreshold: audioSettings.noiseGateThreshold ?? 0.025,
        },
      );

      processed.stream.__audioCleanup = () => {
        processed.stream.getTracks().forEach((track) => track.stop());
        processed.cleanup();
        mediaService.stopStream(rawStream);
      };

      return processed.stream;
    } catch (err) {
      console.warn("[MediaService] Audio processing is unavailable", err);
      return rawStream;
    }
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

  async testMicrophone(deviceId, options = {}) {
    const stream = await mediaService.getMicrophone(deviceId, {
      processAudio: true,
      ...options,
    });
    return stream;
  },

  async stopTestMicrophone(stream) {
    if (stream) {
      mediaService.stopStream(stream);
    }
  },

  stopStream(stream) {
    if (stream?.__audioCleanup) {
      stream.__audioCleanup();
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
  },
};
