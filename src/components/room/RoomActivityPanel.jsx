import React from "react";
import cls from "./Room.module.css";

const RoomActivityPanel = ({
  visible = true,
  compact = false,
  micMuted = false,
  headphonesMuted = false,
  cameraEnabled = false,
  screenShareEnabled = false,
  onToggleHeadphones,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}) => (
  <div
    className={`${cls.room_activity_panel} ${
      visible ? cls.room_activity_panel_visible : ""
    } ${compact ? cls.room_activity_panel_compact : ""}`}
  >
    <button
      className={`${cls.room_activity_btn} ${
        screenShareEnabled ? cls.active : ""
      }`}
      type="button"
      onClick={onToggleScreenShare}
      title={screenShareEnabled ? "Остановить демонстрацию" : "Показать экран"}
    >
      <span aria-hidden="true">
        <img src="/monitor.svg" alt="" />
      </span>
    </button>

    <button
      className={`${cls.room_activity_btn} ${cameraEnabled ? cls.active : ""}`}
      type="button"
      onClick={onToggleCamera}
      title={cameraEnabled ? "Выключить камеру" : "Включить камеру"}
    >
      <span aria-hidden="true">
        <img src="/camera.svg" alt="" />
      </span>
    </button>

    <button
      className={`${cls.room_activity_btn} ${cls.headphones} ${
        headphonesMuted ? cls.muted : ""
      }`}
      type="button"
      onClick={onToggleHeadphones}
      title={headphonesMuted ? "Включить наушники" : "Выключить наушники"}
    >
      <img
        src={headphonesMuted ? "/headphones-off.svg" : "/headphones.svg"}
        alt=""
      />
    </button>

    <button
      className={`${cls.room_activity_btn} ${cls.mic} ${
        micMuted ? cls.muted : ""
      }`}
      type="button"
      onClick={onToggleMic}
      title={
        headphonesMuted
          ? "Включите наушники, чтобы включить микрофон"
          : micMuted
            ? "Включить микрофон"
            : "Выключить микрофон"
      }
      aria-disabled={headphonesMuted}
    >
      <img src={micMuted ? "/mic-off.svg" : "/mic.svg"} alt="" />
    </button>

    <button
      className={`${cls.room_activity_btn} ${cls.leave}`}
      type="button"
      onClick={onLeave}
      title="Выйти из голосовой комнаты"
    >
      <img src="/leave.svg" alt="" />
    </button>
  </div>
);

export default RoomActivityPanel;
