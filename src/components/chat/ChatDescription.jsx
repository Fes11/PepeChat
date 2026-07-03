import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../main.jsx";
import Search from "../UI/Input/Search";
import ChatDescriptionBtn from "../UI/Button/ChatDescriptionBtn";
import Select from "../UI/Select";
import Participant from "./Participant";

const ChatDescription = ({ participants = [] }) => {
  const { ChatStore } = useContext(Context);

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
        </div>

        <Search placeholder="Search..." /> */}

        <div className="chat_description__online">
          Online – {onlineParticipants.length}
        </div>

        <div className="participants_list">
          {onlineParticipants.map((participant) => (
            <Participant key={participant.user.id} user={participant.user} />
          ))}
        </div>

        <div className="chat_description__online">
          Offline – {offlineParticipants.length}
        </div>

        <div className="participants_list">
          {offlineParticipants.map((participant) => (
            <Participant key={participant.user.id} user={participant.user} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default observer(ChatDescription);
