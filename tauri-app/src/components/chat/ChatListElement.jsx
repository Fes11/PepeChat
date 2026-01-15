import React, { useContext } from "react";
import ChatAvatar from "../UI/ChatAvatar";
import { format, parseISO } from "date-fns";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ChatListElement = observer(({ chat, isSelected, isLast }) => {
  const { chatStore } = useContext(Context);
  const lastMessage = chatStore.getLastMessage(chat.id);
  const last_message_time =
    lastMessage?.created_at || chat.last_message?.created_at;
  const last_message_text =
    lastMessage?.text || chat.last_message?.text || "Сообщений пока нет";
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
          {last_message_text}
          ...
        </p>
      </div>

      <p className="chat_list_element__time">
        {last_message_time
          ? format(parseISO(last_message_time), "HH:mm")
          : chat_created_time}

        <div className="new_messages_count">2</div>
      </p>
    </div>
  );
});

export default ChatListElement;
