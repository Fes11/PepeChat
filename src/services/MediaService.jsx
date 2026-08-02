import { audioProcessingService } from "./AudioProcessingService";
import { DEFAULT_MICROPHONE_SETTINGS } from "../constants/audioSettings";

export const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
  sampleRate: 48000,
  sampleSize: 16,
  channelCount: 1,
  latency: { ideal: 0.02 },
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

const applyVerifiedNoiseSuppression = async (track, enabled) => {
  if (!track?.applyConstraints) return false;

  try {
    await track.applyConstraints({
      noiseSuppression: { exact: enabled },
    });
  } catch (exactError) {
    try {
      await track.applyConstraints({ noiseSuppression: enabled });
    } catch (error) {
      console.warn(
        `[MediaService] Cannot ${enabled ? "enable" : "disable"} WebRTC noise suppression`,
        error,
      );
      return false;
    }
    console.debug(
      "[MediaService] Exact noise suppression constraint was unavailable",
      exactError,
    );
  }

  const actual = track.getSettings?.().noiseSuppression;
  return actual === undefined ? true : actual === enabled;
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
      volume = DEFAULT_MICROPHONE_SETTINGS.volume,
      audioSettings = {},
    } = options;
    const noiseSuppressionMode =
      audioSettings.noiseSuppressionMode ??
      DEFAULT_MICROPHONE_SETTINGS.noiseSuppressionMode;
    const supportedConstraints =
      navigator.mediaDevices.getSupportedConstraints?.() ?? {};
    const rnnoiseSupported = audioProcessingService.isRnnoiseSupported();
    let useRnnoise =
      processAudio &&
      noiseSuppressionMode === "strong" &&
      rnnoiseSupported;
    let audioConstraints = {
      ...DEFAULT_AUDIO_CONSTRAINTS,
      autoGainControl:
        audioSettings.autoGainControl ??
        DEFAULT_MICROPHONE_SETTINGS.autoGainControl,
      // RNNoise must receive audio which has not already been denoised. AEC is
      // intentionally left enabled because it solves a separate echo problem.
      noiseSuppression: useRnnoise
        ? supportedConstraints.noiseSuppression
          ? { exact: false }
          : false
        : noiseSuppressionMode !== "off",
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    };

    let rawStream;
    try {
      rawStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
    } catch (error) {
      const failedToDisableNoiseSuppression =
        useRnnoise &&
        error?.name === "OverconstrainedError" &&
        (!error.constraint || error.constraint === "noiseSuppression");

      if (!failedToDisableNoiseSuppression) throw error;

      console.warn(
        "[MediaService] Raw microphone audio is unavailable; using WebRTC noise suppression",
        error,
      );
      useRnnoise = false;
      audioConstraints = {
        ...audioConstraints,
        noiseSuppression: true,
      };
      rawStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
    }

    const rawTrack = rawStream.getAudioTracks()[0];
    let rawTrackSettings = rawTrack?.getSettings?.() ?? {};
    if (useRnnoise && rawTrackSettings.noiseSuppression === true) {
      console.warn(
        "[MediaService] Browser noise suppression remained enabled; skipping RNNoise to avoid double processing",
      );
      useRnnoise = false;
    }

    const expectsBrowserNoiseSuppression =
      !useRnnoise && noiseSuppressionMode !== "off";
    if (
      rawTrack &&
      rawTrackSettings.noiseSuppression !== undefined &&
      rawTrackSettings.noiseSuppression !== expectsBrowserNoiseSuppression
    ) {
      await applyVerifiedNoiseSuppression(
        rawTrack,
        expectsBrowserNoiseSuppression,
      );
      rawTrackSettings = rawTrack.getSettings?.() ?? rawTrackSettings;
    }

    console.info("[MediaService] Microphone processing settings", {
      requestedNoiseSuppressionMode: noiseSuppressionMode,
      effectiveNoiseSuppressionMode: useRnnoise
        ? "rnnoise"
        : rawTrackSettings.noiseSuppression === true ||
            audioConstraints.noiseSuppression === true
          ? "webrtc"
          : "off",
      supportedConstraints,
      trackConstraints: rawTrack?.getConstraints?.() ?? {},
      trackSettings: rawTrackSettings,
    });

    if (!processAudio) return rawStream;

    try {
      const processed = await audioProcessingService.createProcessedMicrophoneStream(
        rawStream,
        {
          volume: audioSettings.autoGainControl ? 1 : volume,
          autoGainControl:
            audioSettings.autoGainControl ??
            DEFAULT_MICROPHONE_SETTINGS.autoGainControl,
          noiseSuppressionMode: useRnnoise
            ? "strong"
            : noiseSuppressionMode === "strong"
              ? "light"
              : noiseSuppressionMode,
          noiseGateEnabled:
            audioSettings.noiseGateEnabled ??
            DEFAULT_MICROPHONE_SETTINGS.noiseGateEnabled,
          noiseGateThreshold:
            audioSettings.noiseGateThreshold ??
            DEFAULT_MICROPHONE_SETTINGS.noiseGateThreshold,
        },
      );

      let cleanedUp = false;
      processed.stream.__audioCleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        processed.stream.getTracks().forEach((track) => track.stop());
        processed.cleanup();
        if (rawStream !== processed.stream) {
          rawStream.getTracks().forEach((track) => track.stop());
        }
      };
      processed.stream.__setAudioVolume = processed.setVolume;
      processed.stream.__updateAudioSettings = (
        nextSettings = {},
        changedKeys = [],
      ) =>
        processed.updateSettings(
          {
            ...nextSettings,
            volume: nextSettings.autoGainControl
              ? 1
              : (nextSettings.volume ?? volume),
          },
          changedKeys,
        );
      processed.stream.__audioProcessingState = processed.processingState;

      console.info("[MediaService] Processed microphone track settings", {
        processingState: processed.processingState,
        trackSettings:
          processed.stream.getAudioTracks()[0]?.getSettings?.() ?? {},
      });

      return processed.stream;
    } catch (err) {
      console.warn("[MediaService] Audio processing is unavailable", err);
      if (noiseSuppressionMode === "strong") {
        await applyVerifiedNoiseSuppression(rawTrack, true);
      }
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
