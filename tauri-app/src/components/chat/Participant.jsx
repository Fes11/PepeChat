import React, { useState } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";

const Participant = function ({ user }) {
  return (
    <div className="participant">
      <UserAvatar
        src={user.avatar || "/default.jpg"}
        width="28px"
        height="28px"
      />
      <div className="participant__description">
        <p>{user.username}</p>
        <p className="participant__description_login">@{user.login}</p>
      </div>
    </div>
  );
};

export default Participant;
