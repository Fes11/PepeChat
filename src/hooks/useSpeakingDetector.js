import { useCallback, useRef } from "react";

const SPEAKING_CHECK_INTERVAL = 120;
const SPEAKING_THRESHOLD = 0.02;
const SPEAKING_RELEASE_DELAY = 400;

const useSpeakingDetector = ({ isMutedRef, onSpeakingChange }) => {
  const detectorRef = useRef(null);

  const stopSpeakingDetection = useCallback(() => {
    const detector = detectorRef.current;
    if (!detector) return;

    clearInterval(detector.intervalId);
    detector.source?.disconnect();
    detector.analyser?.disconnect();
    detector.audioContext?.close().catch(() => {});
    detectorRef.current = null;
  }, []);

  const startSpeakingDetection = useCallback(
    async (stream) => {
      stopSpeakingDetection();

      const audioTrack = stream?.getAudioTracks?.()[0];
      if (!audioTrack) return;

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") {
        await audioContext.resume().catch(() => {});
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.25;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      let isSpeaking = false;
      let lastVoiceAt = 0;

      const intervalId = setInterval(() => {
        if (isMutedRef.current?.muted || !audioTrack.enabled) {
          if (isSpeaking) {
            isSpeaking = false;
            onSpeakingChange(false);
          }
          return;
        }

        analyser.getByteTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const normalized = (data[i] - 128) / 128;
          sum += normalized * normalized;
        }

        const volume = Math.sqrt(sum / data.length);
        const now = Date.now();

        if (volume >= SPEAKING_THRESHOLD) {
          lastVoiceAt = now;
          if (!isSpeaking) {
            isSpeaking = true;
            onSpeakingChange(true);
          }
          return;
        }

        if (isSpeaking && now - lastVoiceAt >= SPEAKING_RELEASE_DELAY) {
          isSpeaking = false;
          onSpeakingChange(false);
        }
      }, SPEAKING_CHECK_INTERVAL);

      detectorRef.current = {
        intervalId,
        audioContext,
        analyser,
        source,
      };
    },
    [isMutedRef, onSpeakingChange, stopSpeakingDetection],
  );

  return {
    startSpeakingDetection,
    stopSpeakingDetection,
  };
};

export default useSpeakingDetector;
