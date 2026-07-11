import React, { useContext } from "react";
import ChatAvatar from "../UI/ChatAvatar";
import UserAvatar from "../UI/UserAvatar.jsx";
import { format, parseISO } from "date-fns";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const getUserDisplayName = (user) =>
  user?.username || user?.login || user?.name || "Пользователь";

const ChatListElement = observer(({ chat, isSelected, isLast }) => {
  const { AuthStore, ChatStore } = useContext(Context);
  const navigate = useNavigate();
  const lastMessage = ChatStore.getLastMessage(chat.id);
  const chatLastMessage = lastMessage || chat.last_message;
  const last_message_time =
    chatLastMessage?.created_at;
  const lastMessageAuthor = chatLastMessage?.author?.user;
  const isOwnLastMessage =
    lastMessageAuthor?.id != null
    && String(lastMessageAuthor.id) === String(AuthStore?.user?.id);
  const lastMessagePrefix = isOwnLastMessage
    ? "Вы"
    : getUserDisplayName(lastMessageAuthor);
  const lastMessageText = chatLastMessage?.text;
  const last_message_text = lastMessageText
    ? `${lastMessagePrefix}: ${lastMessageText}`
    : "Сообщений пока нет";
  const voiceParticipants = ChatStore.getVoiceParticipants(chat.id);
  const hasVoiceParticipants = voiceParticipants.length > 0;
  const visibleVoiceAvatars =
    voiceParticipants.length > 3
      ? voiceParticipants.slice(0, 2)
      : voiceParticipants.slice(0, 3);
  const chatCreatedAt = chat?.created_at;
  const chat_created_time = chatCreatedAt
    ? format(parseISO(chatCreatedAt), "HH:mm")
    : null;

  return (
    <div
      onClick={() => {
        navigate(`/chat/${chat.id}`);
      }}
      className={"chat_list_element" + (isSelected ? " chat_active" : "")}
      style={{ marginBottom: isLast ? "50px" : undefined }}
    >
      {chat.is_group ? (
        <ChatAvatar src={chat?.avatar} />
      ) : (
        <UserAvatar
          src={chat?.other_user?.avatar}
          status={chat?.other_user?.status}
        />
      )}

      <div className="chat_list_element__text_box">
        {chat.is_group ? (
          <b className="chat_list_element__title">{chat.name}</b>
        ) : (
          <b className="chat_list_element__title">
            {chat?.other_user?.username || chat?.other_user?.login}
          </b>
        )}
        <p className="chat_list_element__last_message">{last_message_text}</p>
      </div>

      <div className="chat_list_element__time">
        {hasVoiceParticipants && (
          <div
            className="chat_list_element__voice"
            title={`В голосовой комнате: ${voiceParticipants.length}`}
          >
            <div className="chat_list_element__voice_avatars">
              {visibleVoiceAvatars.map((participant) => (
                <img
                  key={participant.id}
                  src={
                    resolveMediaUrl(participant.user?.avatar) || "/default.jpg"
                  }
                  alt=""
                  className="chat_list_element__voice_avatar"
                />
              ))}

              {voiceParticipants.length > 3 && (
                <span className="chat_list_element__voice_count">
                  {voiceParticipants.length}
                </span>
              )}
            </div>

            <img
              src="/voice.svg"
              alt=""
              className="chat_list_element__voice_icon"
            />
          </div>
        )}

        {last_message_time
          ? format(parseISO(last_message_time), "HH:mm")
          : chat_created_time}

        {chat.unread_count && chat.unread_count !== 0 ? (
          <div className="new_messages_count">{chat.unread_count}</div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
});

export default ChatListElement;
