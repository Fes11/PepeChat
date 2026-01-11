import React, { useContext } from "react";
import ChatAvatar from "../UI/ChatAvatar";
import { format, parseISO } from "date-fns";
import { Context } from "../../main.jsx";

const ChatListElement = ({ chat, isSelected, isLast }) => {
  const { chatStore } = useContext(Context);
  const lastMessageCreatedAt = chat?.last_message?.created_at;
  const last_message_time = lastMessageCreatedAt
    ? format(parseISO(lastMessageCreatedAt), "HH:mm")
    : null;

  const chatCreatedAt = chat?.created_at;
  const chat_created_time = chatCreatedAt
    ? format(parseISO(chatCreatedAt), "HH:mm")
    : null;

  return (
    <div
      onClick={() => chatStore.openChat(chat)}
      className={"chat_list_element" + (isSelected ? " chat_active" : "")}
      style={{ marginBottom: isLast ? "50px" : undefined }}
    >
      <ChatAvatar src={chat.avatar} />

      <div className="chat_list_element__text_box">
        <b className="chat_list_element__title">{chat.name}</b>
        <p className="chat_list_element__last_message">
          {chat?.last_message && chat?.last_message?.text
            ? chat?.last_message?.text
            : "Сообщений пока нет"}
          ...
        </p>
      </div>

      <p className="chat_list_element__time">
        {last_message_time || chat_created_time}
      </p>
    </div>
  );
};

export default ChatListElement;
