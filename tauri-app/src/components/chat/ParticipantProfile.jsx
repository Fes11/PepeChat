import React, { useState } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";

const ParticipantProfile = ({ user }) => {
  return (
    <div className="participant_profile">
        <div className="participant_profile_header">
            <UserAvatar
                src={user.avatar || "/default.jpg"}
                width="50px"
                height="50px"
            />
            <p className="participant__description">{user.username}</p>
            {user.login && (<p className="participant__description_login">@{user.login}</p>)}
        </div>
        <div className="participant_profile_description">

        </div>
    </div>
  );
};

export default ParticipantProfile;
