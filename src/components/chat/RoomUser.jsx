import { useContext, useEffect, useRef } from "react";
import cls from "./RoomUser.module.css";
import UserAvatar from "../UI/UserAvatar.jsx";
import { Context } from "../../main";
import { mediaService } from "../../services/MediaService";

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
  onContextMenu,
}) {
  const { MediaStore } = useContext(Context);
  const audioRef = useRef(null);
  const isHeadphonesMuted = Boolean(participant.state?.deafened);
  const isMicMuted = Boolean(participant.state?.muted) && !isHeadphonesMuted;

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

    audio.muted = soundMuted || userMuted;
    audio.volume = volume;

    if (!audio.muted) {
      playAudio(audio);
    }
  }, [participant.stream, soundMuted, userMuted, volume]);

  return (
    <div
      className={`${cls.room_user} ${participant.state?.speaking ? cls.speaking : ""}`}
      onContextMenu={onContextMenu}
    >
      <UserAvatar
        src={participant.user.avatar}
        className={cls.room_user_avatar}
      />
      <div className={cls.room_user_name_row}>
        <p className={cls.room_user_name}>
          {participant.user.username || participant.user.login}
        </p>

        {(isHeadphonesMuted || isMicMuted) && (
          <span className={cls.room_user_status}>
            {isHeadphonesMuted && (
              <img src="/headphones-off.svg" alt="headphones muted" />
            )}
            {isMicMuted && <img src="/mic-off.svg" alt="microphone muted" />}
          </span>
        )}
      </div>
      <audio ref={audioRef} autoPlay playsInline muted={soundMuted} />
    </div>
  );
};

export default RoomUser;
