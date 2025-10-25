import React from "react";
import Search from "../UI/Input/Search";
import ChatDescriptionBtn from "../UI/Button/ChatDescriptionBtn"
import Select from "../UI/Select";
import Participant from "./Participant"

const ChatDescription = () => {

  return (
    <div className="chat_description">
        <div className="chat_description__content">
          <div className="chat_description__buttons">
            <ChatDescriptionBtn disabled>Descriptions</ChatDescriptionBtn>
            <ChatDescriptionBtn>Attachments</ChatDescriptionBtn>
          </div>

          <Search placeholder="Search..."/>

          <div className="chat_description__online">
            Online
          </div>

          <div className="participants_list">
            <Participant />
            <Participant />
            <Participant />
          </div>

          <div className="chat_description__online">
            Offline
          </div>

          <div className="participants_list">
            <Participant />
            <Participant />
            <Participant />
          </div>
        </div>
    </div>
  );
};

export default ChatDescription;
