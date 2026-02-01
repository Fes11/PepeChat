import React, { useState, useContext } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";
import { Context } from "../../main";

const ParticipantProfile = ({ user, ref }) => {
  const { AuthStore } = useContext(Context);
  const { ChatStore } = useContext(Context);

  return (
    <div className="participant_profile" ref={ref}>
      <div className="participant_profile_header">
        <UserAvatar
          src={user.avatar}
          status={user.status}
          width="50px"
          height="50px"
        />
        <div className="participant_profile_header_box">
          {user.username && (
            <p className="participant__description">{user.username}</p>
          )}
          {user.login && (
            <p className="participant__description_login">@{user.login}</p>
          )}
        </div>
      </div>

      {AuthStore.user.id !== user.id && (
        <button
          className="participant_profile_send_mes"
          onClick={() => ChatStore.openPrivateChat(user)}
        >
          Send message
        </button>
      )}
    </div>
  );
};

export default ParticipantProfile;
