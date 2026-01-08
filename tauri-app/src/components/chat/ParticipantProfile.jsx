import React, { useState } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";

const ParticipantProfile = ({ user, ref }) => {
  return (
    <div className="participant_profile" ref={ref}>
      <div className="participant_profile_header">
        <UserAvatar src={user.avatar} width="50px" height="50px" />
        <div className="participant_profile_header_box">
          {user.username && (
            <p className="participant__description">{user.username}</p>
          )}
          {user.login && (
            <p className="participant__description_login">@{user.login}</p>
          )}
        </div>
      </div>
      <button className="participant_profile_send_mes">Send message</button>
    </div>
  );
};

export default ParticipantProfile;
