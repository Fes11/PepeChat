import {
  RnnoiseWorkletNode,
  loadRnnoise,
} from "@sapphi-red/web-noise-suppressor";
import rnnoiseWorkletSource from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?raw";
import rnnoiseWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseSimdWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import {
  DEFAULT_NOISE_FLOOR,
  calculateRms,
  createSoftLimiterCurve,
  getAdaptiveGateThresholds,
  updateNoiseFloor,
} from "./audioProcessingUtils";

const AUDIO_SAMPLE_RATE = 48000;
const HIGHPASS_FREQUENCY = 80;
const GATE_CHECK_INTERVAL = 20;
const GATE_CLOSED_GAIN = 0;
const GATE_ATTACK_SECONDS = 0.006;
const GATE_RELEASE_SECONDS = 0.12;
const GATE_HOLD_MS = 220;
const RNNOISE_READY_TIMEOUT_MS = 2500;

const getAudioContextClass = () =>
  window.AudioContext || window.webkitAudioContext;

let rnnoiseBinaryPromise = null;

const loadRnnoiseBinary = () => {
  if (!rnnoiseBinaryPromise) {
    rnnoiseBinaryPromise = loadRnnoise({
      url: rnnoiseWasmUrl,
      simdUrl: rnnoiseSimdWasmUrl,
    }).catch((error) => {
      rnnoiseBinaryPromise = null;
      throw error;
    });
  }

  return rnnoiseBinaryPromise;
};

const enableBrowserNoiseSuppression = async (stream) => {
  const supported =
    navigator.mediaDevices?.getSupportedConstraints?.().noiseSuppression;
  if (supported === false) return false;

  const results = await Promise.all(
    stream.getAudioTracks().map(async (track) => {
      try {
        await track.applyConstraints({
          noiseSuppression: { exact: true },
        });
      } catch (exactError) {
        try {
          await track.applyConstraints({ noiseSuppression: true });
        } catch (error) {
          console.warn(
            "[AudioProcessing] Cannot enable WebRTC noise suppression fallback",
            error,
          );
          return false;
        }
        console.debug(
          "[AudioProcessing] Exact WebRTC noise suppression was unavailable",
          exactError,
        );
      }

      return track.getSettings?.().noiseSuppression !== false;
    }),
  );

  return results.some(Boolean);
};

// The dependency initializes WASM asynchronously inside the render thread and
// otherwise emits silence until it is ready. Intercept its registration so the
// processor passes input through while loading and explicitly reports ready or
// runtime-error to the control thread.
const RNNOISE_MONITOR_SOURCE = String.raw`
const pepeNativeRegisterProcessor = globalThis.registerProcessor.bind(globalThis);
globalThis.registerProcessor = (name, ProcessorClass) => {
  class PepeMonitoredRnnoiseProcessor extends ProcessorClass {
    constructor(options) {
      super(options);
      this.pepeReady = false;
      this.pepeFailed = false;
    }

    pepeCopyInput(inputs, outputs) {
      const input = inputs[0] || [];
      const output = outputs[0] || [];
      const channels = Math.min(input.length, output.length);
      for (let channel = 0; channel < channels; channel += 1) {
        output[channel].set(input[channel]);
      }
    }

    process(inputs, outputs, parameters) {
      if (this.pepeFailed) {
        this.pepeCopyInput(inputs, outputs);
        return true;
      }

      try {
        const keepAlive = super.process(inputs, outputs, parameters);
        if (!this.processor) {
          this.pepeCopyInput(inputs, outputs);
        } else if (!this.pepeReady) {
          this.pepeReady = true;
          this.port.postMessage({ type: "ready" });
        }
        return keepAlive;
      } catch (error) {
        this.pepeFailed = true;
        this.pepeCopyInput(inputs, outputs);
        this.port.postMessage({
          type: "runtime-error",
          message: error && error.message ? error.message : String(error),
        });
        return true;
      }
    }
  }

  globalThis.registerProcessor = pepeNativeRegisterProcessor;
  pepeNativeRegisterProcessor(name, PepeMonitoredRnnoiseProcessor);
};
`;

const addMonitoredRnnoiseModule = async (audioContext) => {
  const moduleBlob = new Blob(
    [RNNOISE_MONITOR_SOURCE, "\n", rnnoiseWorkletSource],
    { type: "text/javascript" },
  );
  const moduleUrl = URL.createObjectURL(moduleBlob);

  try {
    await audioContext.audioWorklet.addModule(moduleUrl);
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }
};

const waitForRnnoiseReady = (node, onRuntimeFailure) =>
  new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      settled = true;
      reject(new Error("RNNoise initialization timed out"));
    }, RNNOISE_READY_TIMEOUT_MS);

    const fail = (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
        return;
      }
      onRuntimeFailure(error);
    };

    node.port.onmessage = (event) => {
      if (event.data?.type === "ready") {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve();
        return;
      }

      if (event.data?.type === "runtime-error") {
        fail(new Error(event.data.message || "RNNoise runtime error"));
      }
    };
    node.port.start?.();
    node.onprocessorerror = (event) => {
      fail(new Error(event.message || "RNNoise processor error"));
    };
  });

const setGainTarget = (audioParam, value, audioContext, timeConstant) => {
  audioParam.cancelScheduledValues(audioContext.currentTime);
  audioParam.setTargetAtTime(
    value,
    audioContext.currentTime,
    Math.max(0.001, timeConstant),
  );
};

export const audioProcessingService = {
  isRnnoiseSupported() {
    const AudioContextClass = getAudioContextClass();
    return Boolean(
      AudioContextClass &&
        window.AudioWorkletNode &&
        window.WebAssembly &&
        window.Blob &&
        window.URL?.createObjectURL &&
        "audioWorklet" in AudioContextClass.prototype,
    );
  },

  async createProcessedMicrophoneStream(inputStream, options = {}) {
    const {
      volume = 1,
      autoGainControl = false,
      noiseSuppressionMode = "strong",
      noiseGateEnabled = true,
      noiseGateThreshold = 0.04,
    } = options;
    const AudioContextClass = getAudioContextClass();

    if (!AudioContextClass) {
      return {
        stream: inputStream,
        cleanup: () => {},
        setVolume: () => {},
        updateSettings: () => false,
        processingState: {
          requestedNoiseSuppressionMode: noiseSuppressionMode,
          effectiveNoiseSuppressionMode: "unprocessed",
        },
      };
    }

    const audioContext = new AudioContextClass({
      sampleRate: AUDIO_SAMPLE_RATE,
      latencyHint: "interactive",
    });

    const source = audioContext.createMediaStreamSource(inputStream);
    const destination = audioContext.createMediaStreamDestination();
    const highpass = audioContext.createBiquadFilter();
    const gateAnalyser = audioContext.createAnalyser();
    const gateGain = audioContext.createGain();
    const gainNode = audioContext.createGain();
    const peakLimiter = audioContext.createWaveShaper();

    try {
      destination.channelCount = 1;
      destination.channelCountMode = "explicit";
    } catch (error) {
      console.debug(
        "[AudioProcessing] Mono destination configuration is unavailable",
        error,
      );
    }

    highpass.type = "highpass";
    highpass.frequency.value = HIGHPASS_FREQUENCY;
    highpass.Q.value = Math.SQRT1_2;

    // A memoryless soft peak limiter avoids the fixed 6 ms look-ahead of
    // DynamicsCompressorNode and only changes samples close to clipping.
    peakLimiter.curve = createSoftLimiterCurve();
    peakLimiter.oversample = "none";

    gateAnalyser.fftSize = 1024;
    gateAnalyser.smoothingTimeConstant = 0;
    gainNode.gain.value = autoGainControl ? 1 : volume;

    let gateEnabled = Boolean(noiseGateEnabled);
    let gateSensitivity = noiseGateThreshold;
    // Start open so joining a room or changing modes cannot eat the first
    // consonant. The hold timer closes it shortly afterwards if there is no
    // speech.
    let gateOpen = true;
    let lastVoiceAt = performance.now();
    let noiseFloor = DEFAULT_NOISE_FLOOR;
    gateGain.gain.value = 1;

    highpass.connect(gateAnalyser);
    highpass.connect(gainNode);
    gainNode.connect(peakLimiter);
    peakLimiter.connect(gateGain);
    gateGain.connect(destination);

    const processingState = {
      requestedNoiseSuppressionMode: noiseSuppressionMode,
      effectiveNoiseSuppressionMode:
        noiseSuppressionMode === "light" ? "webrtc" : "off",
    };
    let rnnoiseNode = null;
    let usingRnnoise = false;
    let cleanedUp = false;
    let fallbackPromise = null;

    if (audioContext.state === "suspended") {
      await audioContext.resume().catch((error) =>
        console.warn("[AudioProcessing] Cannot resume AudioContext", error),
      );
    }

    const activateBrowserFallback = (reason) => {
      if (fallbackPromise) return fallbackPromise;
      if (cleanedUp) return Promise.resolve(false);

      console.warn(
        "[AudioProcessing] RNNoise failed, switching to WebRTC noise suppression",
        reason,
      );
      processingState.effectiveNoiseSuppressionMode = "webrtc";
      usingRnnoise = false;

      try {
        source.disconnect(rnnoiseNode);
      } catch {
        // It may already have been disconnected by a simultaneous error path.
      }
      rnnoiseNode?.disconnect?.();
      rnnoiseNode?.destroy?.();
      rnnoiseNode = null;

      try {
        source.connect(highpass);
      } catch {
        // The direct fallback path may already be connected.
      }

      fallbackPromise = enableBrowserNoiseSuppression(inputStream);
      return fallbackPromise;
    };

    if (noiseSuppressionMode === "strong") {
      try {
        if (audioContext.sampleRate !== AUDIO_SAMPLE_RATE) {
          throw new Error(
            `RNNoise requires ${AUDIO_SAMPLE_RATE} Hz, got ${audioContext.sampleRate} Hz`,
          );
        }

        const [wasmBinary] = await Promise.all([
          loadRnnoiseBinary(),
          addMonitoredRnnoiseModule(audioContext),
        ]);
        rnnoiseNode = new RnnoiseWorkletNode(audioContext, {
          maxChannels: 1,
          wasmBinary,
        });
        source.connect(rnnoiseNode);
        rnnoiseNode.connect(highpass);
        usingRnnoise = true;

        await waitForRnnoiseReady(rnnoiseNode, activateBrowserFallback);
        processingState.effectiveNoiseSuppressionMode = "rnnoise";
      } catch (error) {
        await activateBrowserFallback(error);
      }
    } else {
      source.connect(highpass);
    }

    const gateData = new Float32Array(gateAnalyser.fftSize);
    const gateIntervalId = setInterval(() => {
      gateAnalyser.getFloatTimeDomainData(gateData);
      const rms = calculateRms(gateData);
      const now = performance.now();

      if (!gateEnabled) {
        noiseFloor = updateNoiseFloor(noiseFloor, rms, false);
        if (!gateOpen) {
          gateOpen = true;
          setGainTarget(gateGain.gain, 1, audioContext, GATE_ATTACK_SECONDS);
        }
        return;
      }

      const thresholds = getAdaptiveGateThresholds(
        noiseFloor,
        gateSensitivity,
      );
      const voiceDetected = rms >= thresholds.open;
      const voiceContinues = gateOpen && rms >= thresholds.close;

      if (voiceDetected || voiceContinues) {
        lastVoiceAt = now;
        if (!gateOpen) {
          gateOpen = true;
          setGainTarget(gateGain.gain, 1, audioContext, GATE_ATTACK_SECONDS);
        }
      } else if (gateOpen && now - lastVoiceAt >= GATE_HOLD_MS) {
        gateOpen = false;
        setGainTarget(
          gateGain.gain,
          GATE_CLOSED_GAIN,
          audioContext,
          GATE_RELEASE_SECONDS,
        );
      }

      noiseFloor = updateNoiseFloor(noiseFloor, rms, gateOpen);
    }, GATE_CHECK_INTERVAL);

    const setVolume = (nextVolume) => {
      if (!Number.isFinite(nextVolume)) return;
      setGainTarget(
        gainNode.gain,
        autoGainControl ? 1 : Math.min(2, Math.max(0, nextVolume)),
        audioContext,
        0.01,
      );
    };

    const updateSettings = (nextSettings = {}, changedKeys = []) => {
      const shouldUpdate = (key) =>
        changedKeys.length === 0 || changedKeys.includes(key);

      if (shouldUpdate("volume") && Number.isFinite(nextSettings.volume)) {
        setVolume(nextSettings.volume);
      }

      if (
        shouldUpdate("noiseGateEnabled") &&
        typeof nextSettings.noiseGateEnabled === "boolean"
      ) {
        gateEnabled = nextSettings.noiseGateEnabled;
        gateOpen = true;
        lastVoiceAt = performance.now();
        setGainTarget(gateGain.gain, 1, audioContext, GATE_ATTACK_SECONDS);
      }

      if (
        shouldUpdate("noiseGateThreshold") &&
        Number.isFinite(nextSettings.noiseGateThreshold)
      ) {
        gateSensitivity = nextSettings.noiseGateThreshold;
      }

      return true;
    };

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearInterval(gateIntervalId);
      fallbackPromise = null;

      if (rnnoiseNode) {
        rnnoiseNode.port.onmessage = null;
        rnnoiseNode.onprocessorerror = null;
      }
      [
        source,
        rnnoiseNode,
        highpass,
        gateAnalyser,
        gateGain,
        gainNode,
        peakLimiter,
      ].forEach((node) => node?.disconnect?.());
      if (usingRnnoise) rnnoiseNode?.destroy?.();
      audioContext.close().catch(() => {});
    };

    const outputTrack = destination.stream.getAudioTracks()[0];
    if (outputTrack && "contentHint" in outputTrack) {
      outputTrack.contentHint = "speech";
    }

    return {
      stream: destination.stream,
      cleanup,
      setVolume,
      updateSettings,
      processingState,
    };
  },
};
