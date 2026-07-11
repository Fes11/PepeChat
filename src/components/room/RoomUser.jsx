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
  onContextMenu,
}) {
  const { MediaStore } = useContext(Context);
  const audioRef = useRef(null);
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
    const audio = audioRef.current;
    if (!audio) return;

    mediaService.setAudioOutput(audio, MediaStore.selectedDisplay);
  }, [MediaStore.selectedDisplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = soundMuted || isLocallyMuted;
    audio.volume = volume;

    if (!audio.muted) {
      playAudio(audio);
    }
  }, [participant.stream, soundMuted, isLocallyMuted, volume]);

  return (
    <div
      className={`${cls.room_user} ${participant.state?.speaking ? cls.speaking : ""}`}
      onContextMenu={onContextMenu}
    >
      <UserAvatar
        src={participant.user.avatar}
        wrapperClassName={cls.room_user_avatar_frame}
        className={cls.room_user_avatar}
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
        muted={soundMuted || isLocallyMuted}
      />
    </div>
  );
};

export default RoomUser;
