import React from "react";
import ChatListElement from "./ChatListElement.jsx";
import Profile from "../Profile.jsx";

const ChatList = () => {

  return (
    <div className="chat_list">
        <div className="chat_list__list">
            <input className="chat_list__search" type="text" placeholder="Search..."/>

            <div className="chat__list_filter">
              <img src="/arrow.svg" alt="Arrow" />
              <p className="chat__list_filter_choise">All Chats</p>
            </div>

            <div className="chat__list__scroll">
              <ChatListElement />
              <ChatListElement />
              <ChatListElement />
              <ChatListElement />
            </div>

            <button className="chat_list__btn">
              <img src="/plus.svg" alt="Plus" />
              Create chat</button>
        </div>

        <Profile />
    </div>
  );
};

export default ChatList;
