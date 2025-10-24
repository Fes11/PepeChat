import React from "react";
import ChatAvatar from "../UI/ChatAvatar";

const ChatListElement = () => {

  return (
    <div className="chat_list_element">
        <ChatAvatar />

        <div className="chat_list_element__text_box">
            <b className="chat_list_element__title">Chat Title</b>
            <p className="chat_list_element__last_message">Last message preview...</p>
        </div>
        
        <p className="chat_list_element__time">
            12:34 PM
        </p>
    </div>
  );
};

export default ChatListElement;
