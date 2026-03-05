import React, { useState, useRef, useEffect } from "react";
import cls from "./Room.module.css";
import RoomUser from "./RoomUser";
import { useVoiceRoom } from "../../hooks/useVoiceRoom";

const Room = function ({ setViewRoom, chatId }) {
  const { participants, disconnect } = useVoiceRoom(chatId);

  const leaveRoom = () => {
    disconnect();
    setViewRoom(false);
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
          <img src="/headphones.svg" />
        </button>
        <button className={`${cls.room_activity_btn} ${cls.mic}`}>
          <img src="/mic.svg" />
        </button>
        <button
          className={`${cls.room_activity_btn} ${cls.leave}`}
          onClick={leaveRoom}
        >
          <img src="/leave.svg" />
        </button>
      </div>
    </div>
  );
};

export default Room;
