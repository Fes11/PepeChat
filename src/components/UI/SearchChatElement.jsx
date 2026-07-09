import React, { useContext } from "react";
import ChatAvatar from "./ChatAvatar.jsx";
import classes from "./Input/Search.module.css";
import { Context } from "../../main.jsx";
import { useNavigate } from "react-router-dom";

const SearchChatElement = function ({ chat, requiresJoin = false }) {
  const { ChatStore } = useContext(Context);
  const navigate = useNavigate();

  const openChat = async () => {
    try {
      if (requiresJoin) {
        await ChatStore.joinAndOpenChat(chat.id);
        navigate(`/chat/${chat.id}`);
        return;
      }

      ChatStore.openChat(chat);
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      console.error("Failed to open chat:", error);
    }
  };

  return (
    <div
      key={chat.id}
      className={classes.search_result_item}
      onClick={openChat}
    >
      <ChatAvatar src={chat.avatar} width="28px" height="28px" />

      <div className={classes.search_result_info}>
        <p className={classes.search_result_username}>{chat.name}</p>
        <p className={classes.search_participants_qty}>
          Пользователей: {chat.participants_qty}
        </p>
      </div>
    </div>
  );
};

export default SearchChatElement;
