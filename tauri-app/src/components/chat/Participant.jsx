import React, { useState, useRef, useEffect } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";
import ParticipantProfile from "./ParticipantProfile.jsx";

const Participant = ({ user, onClick, onRemove }) => {
  const [visibleProfile, setvisibleProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  const showProfile = (user) => {
    setProfile(user);
    if (!visibleProfile) {
      setvisibleProfile(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setvisibleProfile(false);
      }
    };

    if (visibleProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visibleProfile]);

  return (
    <div className="participant" onClick={() => showProfile(user)}>
      <UserAvatar src={user.avatar} width="28px" height="28px" />

      <div className="participant__description">
        <p>{user.username}</p>
        <p className="participant__description_login">@{user.login}</p>
      </div>

      {visibleProfile && <ParticipantProfile ref={profileRef} user={profile} />}

      {onRemove && (
        <button
          type="button"
          className="participant__remove"
          onClick={onRemove}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Participant;
