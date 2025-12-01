import React from "react";
import ChatAvatar from "../UI/ChatAvatar";

const ChatListElement = ({ chat }) => {
  return (
    <div className="chat_list_element">
      <ChatAvatar src={chat.avatar} />

      <div className="chat_list_element__text_box">
        <b className="chat_list_element__title">{chat.name}</b>
        <p className="chat_list_element__last_message">
          {chat.last_message}...
        </p>
      </div>

      <p className="chat_list_element__time">12:34 PM</p>
    </div>
  );
};

export default ChatListElement;
