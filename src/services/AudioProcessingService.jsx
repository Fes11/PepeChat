const AUDIO_SAMPLE_RATE = 48000;
const HIGHPASS_FREQUENCY = 80;
const LOWPASS_FREQUENCY = 8000;
const GATE_CHECK_INTERVAL = 16;
const GATE_CLOSED_GAIN = 0.04;
const GATE_ATTACK_SECONDS = 0.015;
const GATE_RELEASE_SECONDS = 0.12;

const getAudioContextClass = () =>
  window.AudioContext || window.webkitAudioContext;

export const audioProcessingService = {
  async createProcessedMicrophoneStream(inputStream, options = {}) {
    const {
      volume = 1,
      noiseSuppressionMode = "light",
      noiseGateEnabled = true,
      noiseGateThreshold = 0.035,
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
    const lowpass = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    const gateAnalyser = audioContext.createAnalyser();
    const gateGain = audioContext.createGain();
    const gainNode = audioContext.createGain();
    const splitter = audioContext.createChannelSplitter(2);
    const stereoMerger = audioContext.createChannelMerger(2);

    highpass.type = "highpass";
    highpass.frequency.value = HIGHPASS_FREQUENCY;

    lowpass.type = "lowpass";
    lowpass.frequency.value =
      noiseSuppressionMode === "strong" ? 7200 : LOWPASS_FREQUENCY;

    compressor.threshold.setValueAtTime(-45, audioContext.currentTime);
    compressor.knee.setValueAtTime(24, audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    gateAnalyser.fftSize = 1024;
    gateAnalyser.smoothingTimeConstant = 0.15;
    gateGain.gain.value = noiseGateEnabled ? GATE_CLOSED_GAIN : 1;
    gainNode.gain.value = volume;

    let rnnoiseNode = null;
    let previousNode = source;

    try {
      if (noiseSuppressionMode !== "off") {
        await audioContext.audioWorklet.addModule("/rnnoise-processor.js");
        rnnoiseNode = new AudioWorkletNode(audioContext, "rnnoise-processor");
        previousNode.connect(rnnoiseNode);
        previousNode = rnnoiseNode;
      }
    } catch (err) {
      console.warn("[AudioProcessing] RNNoise worklet is unavailable", err);
    }

    previousNode.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(gateAnalyser);
    compressor.connect(gateGain);
    gateGain.connect(gainNode);
    // Some WebView2/audio-worklet combinations expose a two-channel signal
    // with voice only in channel 0. Duplicate that channel explicitly so a
    // mono microphone is centered in headphones instead of playing on the left.
    gainNode.connect(splitter);
    splitter.connect(stereoMerger, 0, 0);
    splitter.connect(stereoMerger, 0, 1);
    stereoMerger.connect(destination);

    const gateData = new Uint8Array(gateAnalyser.fftSize);
    const gateThreshold =
      noiseSuppressionMode === "strong"
        ? noiseGateThreshold
        : noiseGateThreshold * 0.8;

    const gateIntervalId = noiseGateEnabled
      ? setInterval(() => {
          gateAnalyser.getByteTimeDomainData(gateData);

          let sum = 0;
          for (let i = 0; i < gateData.length; i += 1) {
            const normalized = (gateData[i] - 128) / 128;
            sum += normalized * normalized;
          }

          const rms = Math.sqrt(sum / gateData.length);
          const targetGain = rms >= gateThreshold ? 1 : GATE_CLOSED_GAIN;

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
        lowpass,
        compressor,
        gateAnalyser,
        gateGain,
        gainNode,
        splitter,
        stereoMerger,
      ].forEach((node) => node?.disconnect?.());
      audioContext.close().catch(() => {});
    };

    return {
      stream: destination.stream,
      cleanup,
      setVolume: (nextVolume) => {
        if (!Number.isFinite(nextVolume)) return;
        gainNode.gain.setValueAtTime(nextVolume, audioContext.currentTime);
      },
    };
  },
};
