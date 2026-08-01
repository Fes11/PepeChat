import React, { useContext } from "react";
import Avatar from "../UI/Avatar/Avatar";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import ReadMessageCheck from "./ReadMessageCheck.jsx";
import styles from "./ChatListElement.module.css";

const getUserDisplayName = (user) =>
  user?.username || user?.login || user?.name || "Пользователь";

const formatUnreadCount = (count) => (count > 99 ? "99+" : count);

const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const formatLastMessageDate = (dateValue, now = new Date()) => {
  if (!dateValue) return null;

  const date = parseISO(dateValue);
  const daysAgo = differenceInCalendarDays(now, date);

  if (daysAgo === 0) return format(date, "HH:mm");
  if (daysAgo === 1) return "Вчера";
  if (daysAgo > 1 && daysAgo < 7) return WEEKDAY_LABELS[date.getDay()];

  return format(date, "dd.MM.yyyy");
};

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
  const lastMessageText = chatLastMessage?.text;
  const hasLastMessage = lastMessageText != null && lastMessageText !== "";
  const lastMessagePreview = hasLastMessage
    ? isOwnLastMessage
      ? lastMessageText
      : `${getUserDisplayName(lastMessageAuthor)}: ${lastMessageText}`
    : "Сообщений пока нет";
  const voiceParticipants = ChatStore.getVoiceParticipants(chat.id);
  const hasVoiceParticipants = voiceParticipants.length > 0;
  const visibleVoiceAvatars = voiceParticipants.slice(
    0,
    voiceParticipants.length > 2 ? 1 : 2,
  );
  const hiddenVoiceParticipantsCount = Math.max(
    0,
    voiceParticipants.length - visibleVoiceAvatars.length,
  );
  const unreadCount = Math.max(0, Number(chat.unread_count) || 0);
  const displayedTime = formatLastMessageDate(
    last_message_time || chat?.created_at,
  );

  return (
    <div
      className={`${styles.item} ${isSelected ? styles.activeItem : ""}`}
      style={{ marginBottom: isLast ? "50px" : undefined }}
    >
      <div
        className={`${styles.content} ${isSelected ? styles.active : ""}`}
        onClick={() => {
          navigate(`/chat/${chat.id}`);
        }}
      >
        <div className={styles.avatarBox}>
          {chat.is_group ? (
            <Avatar
              src={chat?.avatar}
              alt={`Аватар чата ${chat.name}`}
              size={46}
              shape="rounded"
              fallbackSrc="/default_chat_icon.png"
            />
          ) : (
            <Avatar
              src={chat?.other_user?.avatar}
              status={chat?.other_user?.status}
              size={46}
              alt={`Аватар пользователя ${chat?.other_user?.username || chat?.other_user?.login || "неизвестно"}`}
            />
          )}

          {hasVoiceParticipants && (
            <span className={styles.voicePresence}>
              <img src="/gramophone.svg" />
            </span>
          )}
        </div>

        <div className={styles.textBox}>
          <div className={styles.titleRow}>
            <b className={styles.title}>
              {chat.is_group
                ? chat.name
                : chat?.other_user?.username || chat?.other_user?.login}
            </b>
            {displayedTime && (
              <span className={styles.time}>{displayedTime}</span>
            )}
          </div>

          <p className={styles.lastMessage}>
            <span className={styles.lastMessageText}>{lastMessagePreview}</span>
            {hasLastMessage && isOwnLastMessage && (
              <span className={styles.deliveryCheck}>
                <ReadMessageCheck
                  isRead={chatLastMessage?.is_read}
                  deliveryStatus={chatLastMessage?.delivery_status}
                />
              </span>
            )}
          </p>
        </div>

        {(hasVoiceParticipants || unreadCount > 0) && (
          <div className={styles.meta}>
            <div className={styles.indicators}>
              {hasVoiceParticipants && (
                <div
                  className={styles.voiceParticipants}
                  title={`В голосовой комнате: ${voiceParticipants.length}`}
                >
                  <div className={styles.voiceAvatars}>
                    <img className={styles.voiceImg} src="/back.png" />
                    {visibleVoiceAvatars.map((participant, index) => (
                      <Avatar
                        key={participant.id ?? participant.user?.id ?? index}
                        src={participant.user?.avatar}
                        alt={`Аватар пользователя ${getUserDisplayName(participant.user)}`}
                        size={18}
                        className={styles.voiceAvatar}
                      />
                    ))}

                    {hiddenVoiceParticipantsCount > 0 && (
                      <span className={styles.voiceCount}>
                        +{hiddenVoiceParticipantsCount}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {unreadCount > 0 && (
                <div
                  className={styles.unreadCount}
                  title={`Непрочитанных сообщений: ${unreadCount}`}
                  aria-label={`Непрочитанных сообщений: ${unreadCount}`}
                >
                  {formatUnreadCount(unreadCount)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatListElement;
