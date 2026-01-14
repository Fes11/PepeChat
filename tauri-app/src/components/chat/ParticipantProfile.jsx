import React, { useState, useContext } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";
import { Context } from "../../main";

const ParticipantProfile = ({ user, ref }) => {
  const { store } = useContext(Context);
  const { chatStore } = useContext(Context);

  return (
    <div className="participant_profile" ref={ref}>
      <div className="participant_profile_header">
        <UserAvatar user={user} width="50px" height="50px" />
        <div className="participant_profile_header_box">
          {user.username && (
            <p className="participant__description">{user.username}</p>
          )}
          {user.login && (
            <p className="participant__description_login">@{user.login}</p>
          )}
        </div>
      </div>

      {store.user.id !== user.id && (
        <button
          className="participant_profile_send_mes"
          onClick={() => chatStore.openPrivateChat(user)}
        >
          Send message
        </button>
      )}
    </div>
  );
};

export default ParticipantProfile;
