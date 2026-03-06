export const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  autoGainControl: true,
  noiseSuppression: true,
};
export const DEFAULT_VIDEO_CONSTRAINTS = {
  width: 1920,
  height: 1080,
  frameRate: 60,
};
export const ADDITIONAL_VIDEO_CONSTRAINTS = {
  displaySurface: "window",
  cursor: "motion",
};

const useMedia = () => {
  let stream = null;
  let displayStream;

  async function getMedia(constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      return {
        stream,
        tracks: stream.getTracks(),
        audioTracks: stream.getAudioTracks(),
        videoTracks: stream.getVideoTracks(),
      };
    } catch (error) {
      return { error };
    }
  }

  async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device) => {
      console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);

      const microphones = devices.filter((d) => d.kind === "audioinput");
      const cameras = devices.filter((d) => d.kind === "videoinput");
      const speakers = devices.filter((d) => d.kind === "audiooutput");
    });
    return devices;
  }

  async function getDisplayMedia(
    constraints = {
      video: { ...DEFAULT_VIDEO_CONSTRAINTS, ...ADDITIONAL_VIDEO_CONSTRAINTS },
    },
  ) {
    try {
      const stream = displayStream
        ? displayStream
        : (displayStream =
            await navigator.mediaDevices.getDisplayMedia(constraints));

      const [tracks, audioTracks, videoTracks] = [
        stream.getTracks(),
        stream.getAudioTracks(),
        stream.getVideoTracks(),
      ];

      return { stream, tracks, audioTracks, videoTracks };
    } catch (error) {
      return { error };
    }
  }

  async function muteAudio(stream) {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  function stopStream(stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  return {
    getMedia,
    getDevices,
    getDisplayMedia,
    muteAudio,
    stopStream,
  };
};

export default useMedia;
