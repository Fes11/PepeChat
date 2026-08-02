import { useContext, useEffect, useRef } from "react";
import cls from "./RoomUser.module.css";
import Avatar from "../UI/Avatar/Avatar";
import { Context } from "../../main.jsx";
import { mediaService } from "../../services/MediaService.jsx";

const isInterruptedPlayError = (err) =>
  err?.name === "AbortError" &&
  err?.message?.includes("interrupted by a new load request");

const playAudio = (audio) => {
  if (!audio || !audio.srcObject) return;

  audio.play().catch((err) => {
    if (isInterruptedPlayError(err)) return;

    console.warn("[VoiceRoom] Cannot play remote audio", err);
  });
};

const RoomUser = function ({
  participant,
  soundMuted = false,
  userMuted = false,
  volume = 1,
  streamVolume = 0,
  showDetails = false,
  isFocused = false,
  isCompact = false,
  onSelect,
  onContextMenu,
}) {
  const { MediaStore } = useContext(Context);
  const audioRef = useRef(null);
  const screenAudioRef = useRef(null);
  const videoRef = useRef(null);
  const tileRef = useRef(null);
  const videoMedia =
    participant.media?.screen?.track &&
    !participant.media.screen.publication?.isMuted
      ? participant.media.screen
      : participant.media?.camera?.track &&
          !participant.media.camera.publication?.isMuted
        ? participant.media.camera
        : null;
  const isScreenShare = videoMedia === participant.media?.screen;
  const hasActiveVideo = Boolean(
    videoMedia?.track &&
    videoMedia.track?.mediaStreamTrack?.readyState !== "ended",
  );
  const isHeadphonesMuted = Boolean(participant.state?.deafened);
  const isRemoteMicMuted =
    Boolean(participant.state?.muted) && !isHeadphonesMuted;
  const isLocallyMuted = Boolean(userMuted);
  const hasNetworkIssue = Boolean(participant.state?.networkIssue);
  const hasStatus = isLocallyMuted || isHeadphonesMuted || isRemoteMicMuted;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const stream = participant.stream ?? null;

    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
    }

    return () => {
      if (audio.srcObject === stream) {
        audio.pause();
        audio.srcObject = null;
      }
    };
  }, [participant.stream]);

  useEffect(() => {
    const audio = screenAudioRef.current;
    if (!audio) return;
    const stream = participant.media?.screenAudio?.stream ?? null;
    if (audio.srcObject !== stream) audio.srcObject = stream;
    if (stream && !audio.muted) playAudio(audio);
    return () => {
      if (audio.srcObject === stream) {
        audio.pause();
        audio.srcObject = null;
      }
    };
  }, [participant.media?.screenAudio?.stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const track = videoMedia?.track ?? null;
    const stream = videoMedia?.stream ?? null;

    if (track?.attach) {
      track.attach(video);
    } else {
      video.srcObject = stream;
    }
    if (track || stream) video.play().catch(() => {});

    return () => {
      if (track?.detach) track.detach(video);
      else if (video.srcObject === stream) video.srcObject = null;
    };
  }, [videoMedia?.stream, videoMedia?.track]);

  useEffect(() => {
    const tile = tileRef.current;
    const cameraPublication = participant.media?.camera?.publication;
    const screenPublication = participant.media?.screen?.publication;
    if (!tile || (!cameraPublication && !screenPublication)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        cameraPublication?.setSubscribed?.(entry.isIntersecting);
        screenPublication?.setSubscribed?.(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    observer.observe(tile);
    return () => observer.disconnect();
  }, [
    participant.media?.camera?.publication,
    participant.media?.screen?.publication,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    mediaService.setAudioOutput(audio, MediaStore.selectedDisplay);
    mediaService.setAudioOutput(
      screenAudioRef.current,
      MediaStore.selectedDisplay,
    );
  }, [MediaStore.selectedDisplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = soundMuted || isLocallyMuted || participant.isLocalMedia;
    audio.volume = volume;

    if (!audio.muted) {
      playAudio(audio);
    }
    const screenAudio = screenAudioRef.current;
    if (screenAudio) {
      screenAudio.muted = audio.muted;
      screenAudio.volume = streamVolume;
      if (!screenAudio.muted) playAudio(screenAudio);
    }
  }, [
    participant.stream,
    participant.isLocalMedia,
    soundMuted,
    isLocallyMuted,
    volume,
    streamVolume,
  ]);

  return (
    <div
      ref={tileRef}
      className={`${cls.room_user} ${isFocused ? cls.room_user_focused : ""} ${isCompact ? cls.room_user_compact : ""} ${participant.state?.speaking ? cls.speaking : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={isFocused}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      onContextMenu={onContextMenu}
    >
      <Avatar
        src={participant.user.avatar}
        alt={`Аватар пользователя ${participant.user.username || participant.user.login}`}
        size="var(--room-avatar-size)"
        className={cls.room_user_avatar}
      />
      <video
        ref={videoRef}
        className={`${cls.room_user_video} ${isScreenShare ? cls.room_user_video_screen : ""} ${hasActiveVideo ? cls.room_user_video_visible : ""}`}
        autoPlay
        playsInline
        muted
      />
      {hasNetworkIssue && (
        <span
          className={cls.network_issue}
          role="status"
          aria-label="Проблемы с сетью"
          title="У участника проблемы с сетью"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.5 9.7a13 13 0 0 1 12.1-2.6" />
            <path d="M6.5 13.1a8.3 8.3 0 0 1 7.2-1.5" />
            <path d="M9.6 16.5a3.6 3.6 0 0 1 2.8-.5" />
            <path d="M18.5 7.5v6" />
            <path d="M18.5 17.2v.1" />
          </svg>
        </span>
      )}
      <div
        className={`${cls.room_user_name_row} ${
          showDetails ? cls.room_user_name_row_visible : ""
        }`}
      >
        <p className={cls.room_user_name}>
          {participant.user.username || participant.user.login}
        </p>
      </div>

      {hasStatus && (
        <span className={cls.room_user_status}>
          {isLocallyMuted ? (
            <img
              className={cls.local_mute_icon}
              src="/mic-off.svg"
              alt="muted for you"
              title="Вы замутили пользователя"
            />
          ) : (
            <>
              {isHeadphonesMuted && (
                <img src="/headphones-off.svg" alt="headphones muted" />
              )}
              {isRemoteMicMuted && (
                <img src="/mic-off.svg" alt="microphone muted" />
              )}
            </>
          )}
        </span>
      )}

      <audio
        ref={audioRef}
        autoPlay
        playsInline
        muted={soundMuted || isLocallyMuted || participant.isLocalMedia}
      />
      <audio
        ref={screenAudioRef}
        autoPlay
        playsInline
        muted={soundMuted || isLocallyMuted || participant.isLocalMedia}
      />
    </div>
  );
};

export default RoomUser;
