import { useContext, useEffect, useRef } from "react";
import cls from "./RoomUser.module.css";
import UserAvatar from "../UI/UserAvatar.jsx";
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
  showDetails = false,
  isFocused = false,
  isCompact = false,
  onSelect,
  onContextMenu,
}) {
  const { MediaStore } = useContext(Context);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const tileRef = useRef(null);
  const videoMedia = participant.media?.screen?.track &&
    !participant.media.screen.publication?.isMuted
    ? participant.media.screen
    : participant.media?.camera?.track &&
        !participant.media.camera.publication?.isMuted
      ? participant.media.camera
      : null;
  const hasActiveVideo = Boolean(
    videoMedia?.stream &&
      videoMedia.track?.mediaStreamTrack?.readyState !== "ended",
  );
  const isHeadphonesMuted = Boolean(participant.state?.deafened);
  const isRemoteMicMuted =
    Boolean(participant.state?.muted) && !isHeadphonesMuted;
  const isLocallyMuted = Boolean(userMuted);
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
    const video = videoRef.current;
    if (!video) return;
    const stream = videoMedia?.stream ?? null;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [videoMedia?.stream]);

  useEffect(() => {
    const tile = tileRef.current;
    const cameraPublication = participant.media?.camera?.publication;
    const screenPublication = participant.media?.screen?.publication;
    if (!tile || (!cameraPublication && !screenPublication)) return;

    screenPublication?.setSubscribed?.(true);
    const observer = new IntersectionObserver(([entry]) => {
      cameraPublication?.setSubscribed?.(entry.isIntersecting);
    }, { threshold: 0.05 });
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
  }, [MediaStore.selectedDisplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = soundMuted || isLocallyMuted || participant.isLocalMedia;
    audio.volume = volume;

    if (!audio.muted) {
      playAudio(audio);
    }
  }, [participant.stream, participant.isLocalMedia, soundMuted, isLocallyMuted, volume]);

  return (
    <div
      ref={tileRef}
      className={`${cls.room_user} ${isFocused ? cls.room_user_focused : ""} ${isCompact ? cls.room_user_compact : ""} ${participant.state?.speaking ? cls.speaking : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={isFocused}
      title={isFocused ? "Вернуть обычную сетку" : "Показать крупно"}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.();
        }
      }}
      onContextMenu={onContextMenu}
    >
      <UserAvatar
        src={participant.user.avatar}
        wrapperClassName={cls.room_user_avatar_frame}
        className={cls.room_user_avatar}
      />
      <video
        ref={videoRef}
        className={`${cls.room_user_video} ${hasActiveVideo ? cls.room_user_video_visible : ""}`}
        autoPlay
        playsInline
        muted
      />
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
    </div>
  );
};

export default RoomUser;
