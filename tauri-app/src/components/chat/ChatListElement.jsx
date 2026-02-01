import React, { useContext } from "react";
import ChatAvatar from "../UI/ChatAvatar";
import UserAvatar from "../UI/UserAvatar.jsx";
import { format, parseISO } from "date-fns";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ChatListElement = observer(({ chat, isSelected, isLast }) => {
  const { ChatStore } = useContext(Context);
  const lastMessage = ChatStore.getLastMessage(chat.id);
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
      onClick={() => ChatStore.openChat(chat)}
      className={"chat_list_element" + (isSelected ? " chat_active" : "")}
      style={{ marginBottom: isLast ? "50px" : undefined }}
    >
      {chat.is_group ? (
        <ChatAvatar src={chat.avatar} />
      ) : (
        <UserAvatar src={chat.other_user.avatar} />
      )}

      <div className="chat_list_element__text_box">
        {chat.is_group ? (
          <b className="chat_list_element__title">{chat.name}</b>
        ) : (
          <b className="chat_list_element__title">
            {chat.other_user.username || chat.other_user.login}
          </b>
        )}
        <p className="chat_list_element__last_message">{last_message_text}</p>
      </div>

      <div className="chat_list_element__time">
        {last_message_time
          ? format(parseISO(last_message_time), "HH:mm")
          : chat_created_time}

        <div className="new_messages_count">2</div>
      </div>
    </div>
  );
});

export default ChatListElement;
