import React, { useState } from "react";
import cls from "./RoomUser.module.css";
import UserAvatar from "../UI/UserAvatar.jsx";

const RoomUser = function ({ participant }) {
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
    </div>
  );
};

export default RoomUser;
