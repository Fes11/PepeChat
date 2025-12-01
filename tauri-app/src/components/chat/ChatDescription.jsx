import React from "react";
import Search from "../UI/Input/Search";
import ChatDescriptionBtn from "../UI/Button/ChatDescriptionBtn";
import Select from "../UI/Select";
import Participant from "./Participant";

const ChatDescription = () => {
  return (
    <div className="chat_description">
      <div className="chat_description__content">
        <div className="chat_description__buttons">
          <ChatDescriptionBtn disabled>Descriptions</ChatDescriptionBtn>
          <ChatDescriptionBtn>Attach</ChatDescriptionBtn>
        </div>

        <Search placeholder="Search..." />

        <div className="chat_description__online">Online - 3</div>

        <div className="participants_list"></div>

        <div className="chat_description__online">Offline - 3</div>

        <div className="participants_list"></div>
      </div>
    </div>
  );
};

export default ChatDescription;
