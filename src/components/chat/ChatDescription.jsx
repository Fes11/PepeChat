import React, { useContext, useState } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../main.jsx";
import Search from "../UI/Input/Search";
import ChatDescriptionBtn from "../UI/Button/ChatDescriptionBtn";
import Select from "../UI/Select";
import Participant from "./Participant";

const ChatDescription = ({ participants = [] }) => {
  const { ChatStore } = useContext(Context);
  const [expandedSections, setExpandedSections] = useState({
    online: true,
    offline: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const participantsWithPresence = participants.map((participant) => ({
    ...participant,
    user: ChatStore.getUserPresence(participant.user),
  }));

  const onlineParticipants = participantsWithPresence.filter(
    (p) => p.user.status === "online",
  );

  const offlineParticipants = participantsWithPresence.filter(
    (p) => p.user.status === "offline",
  );

  return (
    <div className="chat_description">
      <div className="chat_description__content">
        {/* <div className="chat_description__buttons">
          <ChatDescriptionBtn disabled>Descriptions</ChatDescriptionBtn>
          <ChatDescriptionBtn>Attach</ChatDescriptionBtn>
        </div>*/}

        <button
          type="button"
          className="chat_description__online"
          aria-expanded={expandedSections.online}
          onClick={() => toggleSection("online")}
        >
          <span className="chat_description__status-indicator" />
          <span>
            ОНЛАЙН
            <span className="status_count">{onlineParticipants.length}</span>
          </span>
          {/* <span className="chat_description__arrow" aria-hidden="true" /> */}
        </button>

        <div
          className={`participants_list_shell ${
            expandedSections.online ? "" : "participants_list_shell--collapsed"
          }`}
        >
          <div className="participants_list">
            {onlineParticipants.map((participant) => (
              <Participant key={participant.user.id} user={participant.user} />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="chat_description__online"
          aria-expanded={expandedSections.offline}
          onClick={() => toggleSection("offline")}
        >
          <span className="chat_description__status-indicator-offline" />
          <span>
            ОФЛАЙН
            <span className="status_count">{offlineParticipants.length}</span>
          </span>
          {/* <span className="chat_description__arrow" aria-hidden="true" /> */}
        </button>

        <div
          className={`participants_list_shell ${
            expandedSections.offline ? "" : "participants_list_shell--collapsed"
          }`}
        >
          <div className="participants_list">
            {offlineParticipants.map((participant) => (
              <Participant key={participant.user.id} user={participant.user} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(ChatDescription);
