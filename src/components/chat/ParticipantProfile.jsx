import React, { useContext, forwardRef } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";
import { Context } from "../../main";

const ParticipantProfile = forwardRef(({ user, style }, ref) => {
  const { AuthStore } = useContext(Context);
  const { ChatStore } = useContext(Context);

  return (
    <div className="participant_profile" ref={ref} style={style}>
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
          Отправить сообщение
        </button>
      )}
    </div>
  );
});

ParticipantProfile.displayName = "ParticipantProfile";

export default ParticipantProfile;
