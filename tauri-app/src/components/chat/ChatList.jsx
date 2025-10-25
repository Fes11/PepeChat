import React from "react";
import ChatListElement from "./ChatListElement.jsx";
import Profile from "../Profile.jsx";
import Search from "../UI/Input/Search.jsx";
import Select from "../UI/Select.jsx";

const ChatList = () => {

  return (
    <div className="chat_list">
        <div className="chat_list__list">
            <Search placeholder="Search..."/>

            <Select>
              <option value="">All chats</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </Select>

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
