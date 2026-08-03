import { useCallback, useRef } from "react";

const SPEAKING_CHECK_INTERVAL = 40;
const SPEAKING_OPEN_THRESHOLD = 0.003;
const SPEAKING_CLOSE_THRESHOLD = 0.0015;
const SPEAKING_RELEASE_DELAY = 350;

const useSpeakingDetector = ({ isMutedRef, onSpeakingChange }) => {
  const detectorRef = useRef(null);
  const detectorGenerationRef = useRef(0);

  const stopSpeakingDetection = useCallback(() => {
    detectorGenerationRef.current += 1;
    const detector = detectorRef.current;
    if (!detector) return;

    clearInterval(detector.intervalId);
    detector.audioTrack?.removeEventListener("ended", detector.handleEnded);
    detector.source?.disconnect();
    detector.analyser?.disconnect();
    detector.audioContext?.close().catch(() => {});
    detectorRef.current = null;
    if (detector.isSpeaking) detector.onSpeakingChange(false);
  }, []);

  const startSpeakingDetection = useCallback(
    async (stream) => {
      stopSpeakingDetection();
      const generation = detectorGenerationRef.current;

      const audioTrack = stream?.getAudioTracks?.()[0];
      if (!audioTrack) return;

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      let audioContext;
      try {
        audioContext = new AudioContextClass({ latencyHint: "interactive" });
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
      } catch (error) {
        console.warn("[VoiceRoom] Speaking detector is unavailable", error);
        audioContext?.close().catch(() => {});
        return;
      }

      if (
        generation !== detectorGenerationRef.current ||
        audioTrack.readyState === "ended"
      ) {
        audioContext.close().catch(() => {});
        return;
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.1;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);
      let lastVoiceAt = 0;
      const detector = {
        intervalId: null,
        audioContext,
        analyser,
        source,
        audioTrack,
        handleEnded: null,
        isSpeaking: false,
        onSpeakingChange,
      };

      const setSpeaking = (speaking) => {
        if (detector.isSpeaking === speaking) return;
        detector.isSpeaking = speaking;
        onSpeakingChange(speaking);
      };

      const checkLevel = () => {
        if (
          isMutedRef.current?.muted ||
          !audioTrack.enabled ||
          audioTrack.muted ||
          audioTrack.readyState === "ended"
        ) {
          setSpeaking(false);
          lastVoiceAt = 0;
          return;
        }

        analyser.getFloatTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          sum += data[i] * data[i];
        }

        const volume = Math.sqrt(sum / data.length);
        const now = performance.now();
        const threshold = detector.isSpeaking
          ? SPEAKING_CLOSE_THRESHOLD
          : SPEAKING_OPEN_THRESHOLD;

        if (volume >= threshold) {
          lastVoiceAt = now;
          setSpeaking(true);
          return;
        }

        if (
          detector.isSpeaking &&
          now - lastVoiceAt >= SPEAKING_RELEASE_DELAY
        ) {
          setSpeaking(false);
        }
      };

      detector.handleEnded = () => setSpeaking(false);
      audioTrack.addEventListener("ended", detector.handleEnded);
      detector.intervalId = setInterval(
        checkLevel,
        SPEAKING_CHECK_INTERVAL,
      );
      detectorRef.current = detector;

      // Do not add a complete timer period when audio is already flowing.
      checkLevel();
    },
    [isMutedRef, onSpeakingChange, stopSpeakingDetection],
  );

  return {
    startSpeakingDetection,
    stopSpeakingDetection,
  };
};

export default useSpeakingDetector;
