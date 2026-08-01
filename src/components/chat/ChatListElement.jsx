import React, { useContext } from "react";
import Avatar from "../UI/Avatar/Avatar";
import { format, parseISO } from "date-fns";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import VoiceIcon from "../UI/VoiceIcon.jsx";
import styles from "./ChatListElement.module.css";

const getUserDisplayName = (user) =>
  user?.username || user?.login || user?.name || "Пользователь";

const ChatListElement = observer(({ chat, isSelected, isLast }) => {
  const { AuthStore, ChatStore } = useContext(Context);
  const navigate = useNavigate();
  const lastMessage = ChatStore.getLastMessage(chat.id);
  const chatLastMessage = lastMessage || chat.last_message;
  const last_message_time = chatLastMessage?.created_at;
  const lastMessageAuthor = chatLastMessage?.author?.user;
  const isOwnLastMessage =
    lastMessageAuthor?.id != null &&
    String(lastMessageAuthor.id) === String(AuthStore?.user?.id);
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
      className={`${styles.item} ${isSelected ? styles.active : ""}`}
      style={{ marginBottom: isLast ? "50px" : undefined }}
    >
      {chat.is_group ? (
        <Avatar
          src={chat?.avatar}
          alt={`Аватар чата ${chat.name}`}
          size={40}
          shape="rounded"
          fallbackSrc="/default_chat_icon.png"
        />
      ) : (
        <Avatar
          src={chat?.other_user?.avatar}
          status={chat?.other_user?.status}
          alt={`Аватар пользователя ${chat?.other_user?.username || chat?.other_user?.login || "неизвестно"}`}
        />
      )}

      <div className={styles.textBox}>
        {chat.is_group ? (
          <b className={styles.title}>{chat.name}</b>
        ) : (
          <b className={styles.title}>
            {chat?.other_user?.username || chat?.other_user?.login}
          </b>
        )}
        <p className={styles.lastMessage}>{last_message_text}</p>
      </div>

      <div className={styles.meta}>
        <div className={styles.indicators}>
          {hasVoiceParticipants && (
            <div
              className={styles.voiceParticipants}
              title={`В голосовой комнате: ${voiceParticipants.length}`}
            >
              <div className={styles.voiceAvatars}>
                {visibleVoiceAvatars.map((participant) => (
                  <Avatar
                    key={participant.id}
                    src={participant.user?.avatar}
                    alt={`Аватар пользователя ${getUserDisplayName(participant.user)}`}
                    size={18}
                    className={styles.voiceAvatar}
                  />
                ))}

                {voiceParticipants.length > 3 && (
                  <span className={styles.voiceCount}>
                    {voiceParticipants.length}
                  </span>
                )}
              </div>

              <VoiceIcon />
            </div>
          )}

          {chat.unread_count && chat.unread_count !== 0 ? (
            <div className={styles.unreadCount}>{chat.unread_count}</div>
          ) : (
            ""
          )}
        </div>

        {last_message_time
          ? format(parseISO(last_message_time), "HH:mm")
          : chat_created_time}
      </div>
    </div>
  );
});

export default ChatListElement;
