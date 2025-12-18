import React, { useState } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";
import ParticipantProfile from "./ParticipantProfile.jsx";

const Participant = ({ user, haveProfile }) => {
  const [visible, setVisible] = useState(false);

  const toggleVisible = () => {
    if(!haveProfile) return;
    
    setVisible(prev => !prev);
  };

  return (
    <div className="participant" onClick={toggleVisible}>
      <UserAvatar
        src={user.avatar || "/default.jpg"}
        width="28px"
        height="28px"
      />

      <div className="participant__description">
        <p>{user.username}</p>
        <p className="participant__description_login">
          @{user.login}
        </p>
      </div>

      {visible && (
        <ParticipantProfile user={user}/>
      )}
    </div>
  );
};

export default Participant;
