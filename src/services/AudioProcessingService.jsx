import {
  RnnoiseWorkletNode,
  loadRnnoise,
} from "@sapphi-red/web-noise-suppressor";
import rnnoiseWorkletUrl from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseSimdWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";

const AUDIO_SAMPLE_RATE = 48000;
const HIGHPASS_FREQUENCY = 80;
const GATE_CHECK_INTERVAL = 16;
const GATE_CLOSED_GAIN = 0.04;
const GATE_ATTACK_SECONDS = 0.015;
const GATE_RELEASE_SECONDS = 0.2;
const GATE_CLOSE_THRESHOLD_RATIO = 0.6;

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
  await Promise.all(
    stream.getAudioTracks().map((track) =>
      track
        .applyConstraints({ noiseSuppression: true })
        .catch((error) =>
          console.warn(
            "[AudioProcessing] Cannot enable WebRTC noise suppression fallback",
            error,
          ),
        ),
    ),
  );
};

export const audioProcessingService = {
  isRnnoiseSupported() {
    const AudioContextClass = getAudioContextClass();
    return Boolean(
      AudioContextClass &&
        window.AudioWorkletNode &&
        "audioWorklet" in AudioContextClass.prototype,
    );
  },

  async createProcessedMicrophoneStream(inputStream, options = {}) {
    const {
      volume = 1,
      autoGainControl = false,
      noiseSuppressionMode = "light",
      noiseGateEnabled = false,
      noiseGateThreshold = 0.02,
    } = options;
    const AudioContextClass = getAudioContextClass();

    if (!AudioContextClass) {
      return {
        stream: inputStream,
        cleanup: () => {},
        setVolume: () => {},
      };
    }

    const audioContext = new AudioContextClass({
      sampleRate: AUDIO_SAMPLE_RATE,
      latencyHint: "interactive",
    });

    const source = audioContext.createMediaStreamSource(inputStream);
    const destination = audioContext.createMediaStreamDestination();
    const highpass = audioContext.createBiquadFilter();
    const limiter = audioContext.createDynamicsCompressor();
    const gateAnalyser = audioContext.createAnalyser();
    const gateGain = audioContext.createGain();
    const gainNode = audioContext.createGain();

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

    // This node is only a soft peak limiter. Browser AGC, when enabled, is the
    // sole level controller; the previous -45 dB compressor changed virtually
    // the entire speech envelope and caused audible pumping.
    limiter.threshold.setValueAtTime(-6, audioContext.currentTime);
    limiter.knee.setValueAtTime(3, audioContext.currentTime);
    limiter.ratio.setValueAtTime(8, audioContext.currentTime);
    limiter.attack.setValueAtTime(0.003, audioContext.currentTime);
    limiter.release.setValueAtTime(0.08, audioContext.currentTime);

    gateAnalyser.fftSize = 1024;
    gateAnalyser.smoothingTimeConstant = 0.15;
    gateGain.gain.value = noiseGateEnabled ? GATE_CLOSED_GAIN : 1;
    gainNode.gain.value = autoGainControl ? 1 : volume;

    let rnnoiseNode = null;
    let previousNode = source;

    try {
      if (noiseSuppressionMode === "strong") {
        if (audioContext.sampleRate !== AUDIO_SAMPLE_RATE) {
          throw new Error(
            `RNNoise requires ${AUDIO_SAMPLE_RATE} Hz, got ${audioContext.sampleRate} Hz`,
          );
        }

        const [wasmBinary] = await Promise.all([
          loadRnnoiseBinary(),
          audioContext.audioWorklet.addModule(rnnoiseWorkletUrl),
        ]);
        rnnoiseNode = new RnnoiseWorkletNode(audioContext, {
          maxChannels: 1,
          wasmBinary,
        });
        previousNode.connect(rnnoiseNode);
        previousNode = rnnoiseNode;
      }
    } catch (err) {
      console.warn(
        "[AudioProcessing] RNNoise is unavailable, using WebRTC noise suppression",
        err,
      );
      await enableBrowserNoiseSuppression(inputStream);
    }

    previousNode.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(limiter);
    limiter.connect(gateAnalyser);
    limiter.connect(gateGain);
    gateGain.connect(destination);

    const gateData = new Uint8Array(gateAnalyser.fftSize);
    const gateThreshold =
      noiseSuppressionMode === "strong"
        ? noiseGateThreshold * 0.75
        : noiseGateThreshold * 0.5;
    const gateCloseThreshold = gateThreshold * GATE_CLOSE_THRESHOLD_RATIO;
    let gateOpen = false;

    const gateIntervalId = noiseGateEnabled
      ? setInterval(() => {
          gateAnalyser.getByteTimeDomainData(gateData);

          let sum = 0;
          for (let i = 0; i < gateData.length; i += 1) {
            const normalized = (gateData[i] - 128) / 128;
            sum += normalized * normalized;
          }

          const rms = Math.sqrt(sum / gateData.length);
          if (gateOpen) gateOpen = rms >= gateCloseThreshold;
          else gateOpen = rms >= gateThreshold;
          const targetGain = gateOpen ? 1 : GATE_CLOSED_GAIN;

          gateGain.gain.cancelScheduledValues(audioContext.currentTime);
          gateGain.gain.setTargetAtTime(
            targetGain,
            audioContext.currentTime,
            targetGain === 1 ? GATE_ATTACK_SECONDS : GATE_RELEASE_SECONDS,
          );
        }, GATE_CHECK_INTERVAL)
      : null;

    const cleanup = () => {
      if (gateIntervalId) {
        clearInterval(gateIntervalId);
      }

      [
        source,
        rnnoiseNode,
        highpass,
        limiter,
        gateAnalyser,
        gateGain,
        gainNode,
      ].forEach((node) => node?.disconnect?.());
      rnnoiseNode?.destroy?.();
      audioContext.close().catch(() => {});
    };

    if (audioContext.state === "suspended") {
      await audioContext.resume().catch((error) =>
        console.warn("[AudioProcessing] Cannot resume AudioContext", error),
      );
    }

    const outputTrack = destination.stream.getAudioTracks()[0];
    if (outputTrack && "contentHint" in outputTrack) {
      outputTrack.contentHint = "speech";
    }

    return {
      stream: destination.stream,
      cleanup,
      setVolume: (nextVolume) => {
        if (!Number.isFinite(nextVolume)) return;
        gainNode.gain.setValueAtTime(
          autoGainControl ? 1 : nextVolume,
          audioContext.currentTime,
        );
      },
    };
  },
};
