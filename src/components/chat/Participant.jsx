import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import UserAvatar from "../UI/UserAvatar.jsx";
import ParticipantProfile from "./ParticipantProfile.jsx";

const Participant = ({ user, onClick, onRemove }) => {
  const [visibleProfile, setvisibleProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profilePosition, setProfilePosition] = useState(null);
  const participantRef = useRef(null);
  const profileRef = useRef(null);

  const updateProfilePosition = () => {
    if (!participantRef.current) return;

    const rect = participantRef.current.getBoundingClientRect();
    const profileWidth = profileRef.current?.offsetWidth || 200;
    const profileHeight = profileRef.current?.offsetHeight || 130;
    const gap = 8;
    const viewportGap = 8;
    const hasSpaceOnLeft = rect.left - profileWidth - gap >= viewportGap;

    setProfilePosition({
      left: hasSpaceOnLeft
        ? rect.left - profileWidth - gap
        : Math.min(
            rect.right + gap,
            window.innerWidth - profileWidth - viewportGap,
          ),
      top: Math.max(
        viewportGap,
        Math.min(rect.top - 10, window.innerHeight - profileHeight - viewportGap),
      ),
    });
  };

  const showProfile = (user) => {
    setProfile(user);
    updateProfilePosition();
    if (!visibleProfile) {
      setvisibleProfile(true);
    }
  };

  useLayoutEffect(() => {
    if (!visibleProfile) return;

    updateProfilePosition();
  }, [visibleProfile, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        participantRef.current?.contains(event.target) ||
        profileRef.current?.contains(event.target)
      ) {
        return;
      }

      if (profileRef.current) {
        setvisibleProfile(false);
      }
    };

    const handleWindowChange = () => {
      updateProfilePosition();
    };

    if (visibleProfile) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleWindowChange);
      window.addEventListener("scroll", handleWindowChange, true);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [visibleProfile]);

  return (
    <div
      className="participant"
      ref={participantRef}
      onClick={() => showProfile(user)}
    >
      <UserAvatar
        src={user.avatar}
        status={user.status}
        width="28px"
        height="28px"
      />

      <div className="participant__description">
        <p>{user.username}</p>
        <p className="participant__description_login">@{user.login}</p>
      </div>

      {visibleProfile &&
        profilePosition &&
        createPortal(
          <ParticipantProfile
            ref={profileRef}
            user={profile}
            style={profilePosition}
          />,
          document.body,
        )}

      {onRemove && (
        <button
          type="button"
          className="participant__remove"
          aria-label={`Remove ${user.username || user.login}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Participant;
