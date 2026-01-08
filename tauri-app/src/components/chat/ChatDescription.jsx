import React, { useState, useEffect, useRef } from "react";
import Search from "../UI/Input/Search";
import ChatDescriptionBtn from "../UI/Button/ChatDescriptionBtn";
import Select from "../UI/Select";
import Participant from "./Participant";
import ChatServices from "../../services/ChatService.jsx";
import ParticipantProfile from "./ParticipantProfile.jsx";

const ChatDescription = ({ chat }) => {
  const [participants, setParticipants] = useState([]);
  const [visibleProfile, setvisibleProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  const showProfile = (user) => {
    setProfile(user);
    setvisibleProfile((prev) => !prev);
  };

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await ChatServices.getChatParticipants(chat.id);
        setParticipants(response.data.results);
      } catch (error) {
        console.error("Ошибка при получении участников чата:", error);
      }
    };

    fetchParticipants();
  }, [chat.id]);

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
    <div className="chat_description">
      <div className="chat_description__content">
        {/* <div className="chat_description__buttons">
          <ChatDescriptionBtn disabled>Descriptions</ChatDescriptionBtn>
          <ChatDescriptionBtn>Attach</ChatDescriptionBtn>
        </div>

        <Search placeholder="Search..." /> */}

        <div className="chat_description__online">Online - 3</div>

        <div className="participants_list">
          {participants.map((participant) => (
            <Participant
              key={participant.user.id}
              user={participant.user}
              onClick={() => showProfile(participant.user)}
            />
          ))}

          {visibleProfile && (
            <ParticipantProfile ref={profileRef} user={profile} />
          )}
        </div>

        <div className="chat_description__online">Offline - 3</div>

        <div className="participants_list"></div>
      </div>
    </div>
  );
};

export default ChatDescription;
