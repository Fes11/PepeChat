import React, { useState } from "react";
import cls from "./Room.module.css";
import RoomUser from "./RoomUser";
import { useVoiceRoom } from "../../hooks/useVoiceRoom";

const Room = function ({ setViewRoom, onLeaveRoom, chatId }) {
  const { participants, setMicEnabled, disconnect } = useVoiceRoom(chatId);
  const [muted, setMuted] = useState(false);

  const leaveRoom = () => {
    disconnect();
    onLeaveRoom();
  };

  const toggleMic = () => {
    const next = !muted;
    setMuted(next);
    setMicEnabled(!next); // muted=true → enabled=false
  };

  return (
    <div className={cls.room}>
      <div className={cls.room_header}>
        <button className={cls.hide_btn} onClick={() => setViewRoom(false)} />
        <p>Name Room</p>
      </div>

      <div className={cls.room_users_list}>
        {participants.map((participant) => (
          <RoomUser key={participant.id} participant={participant} />
        ))}
      </div>

      <div className={cls.room_activity_panel}>
        <button className={`${cls.room_activity_btn} ${cls.headphones}`}>
          <img src="/headphones.svg" alt="headphones" />
        </button>

        <button
          className={`${cls.room_activity_btn} ${cls.mic} ${muted ? cls.muted : ""}`}
          onClick={toggleMic}
          title={muted ? "Unmute" : "Mute"}
        >
          <img src={muted ? "/mic-off.png" : "/mic.svg"} alt="mic" />
        </button>

        <button
          className={`${cls.room_activity_btn} ${cls.leave}`}
          onClick={leaveRoom}
        >
          <img src="/leave.svg" alt="leave" />
        </button>
      </div>
    </div>
  );
};

export default Room;
