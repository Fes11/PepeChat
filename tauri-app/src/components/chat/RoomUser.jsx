import { useEffect, useRef } from "react";
import cls from "./RoomUser.module.css";
import UserAvatar from "../UI/UserAvatar.jsx";

const RoomUser = function ({ participant }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && participant.stream) {
      audioRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div
      className={`${cls.room_user} ${participant.state?.speaking ? cls.speaking : ""}`}
    >
      <UserAvatar
        src={participant.user.avatar}
        className={cls.room_user_avatar}
      />
      <p className={cls.room_user_name}>
        {participant.user.username || participant.user.login}
      </p>
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
};

export default RoomUser;
