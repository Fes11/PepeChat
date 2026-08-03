import { useContext, useState } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../main.jsx";
import Participant from "./Participant";
import styles from "./ChatDescription.module.css";
import Avatar from "../UI/Avatar/Avatar.js";

const ChatDescription = ({
  participants = [],
  voiceParticipants = [],
  chat,
  onHide,
}) => {
  const { ChatStore } = useContext(Context);
  const [expandedSections, setExpandedSections] = useState({
    online: true,
    away: true,
    offline: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const participantsWithPresence = participants.map((participant) => ({
    ...participant,
    user: ChatStore.getUserPresence(participant.user),
  }));

  const onlineParticipants = participantsWithPresence.filter(
    (p) => p.user.status === "online",
  );

  const awayParticipants = participantsWithPresence.filter(
    (p) => p.user.status === "away",
  );

  const offlineParticipants = participantsWithPresence.filter(
    (p) => p.user.status === "offline",
  );

  const connectedParticipantsCount =
    onlineParticipants.length + awayParticipants.length;

  const voiceParticipantUserIds = new Set(
    voiceParticipants.map((participant) => String(participant.user?.id)),
  );

  const isUserInVoiceRoom = (user) =>
    user?.id != null && voiceParticipantUserIds.has(String(user.id));

  return (
    <div className={styles.description}>
      <div className={styles.header}>
        <div className={styles.info_box}>
          {chat.is_group ? (
            <Avatar
              src={chat?.avatar}
              size={72}
              shape="rounded"
              fallbackSrc="/default_chat_icon.png"
            />
          ) : (
            <Avatar src={chat?.avatar} size={72} />
          )}

          <div className={styles.info_box_text}>
            <p title={chat?.name}>{chat?.name}</p>
            <span>
              {participantsWithPresence.length} |{" "}
              {connectedParticipantsCount} в сети
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onHide}
          aria-label="Скрыть описание чата"
          title="Скрыть описание чата"
        >
          <img src="/close.svg" alt="" />
        </button>
      </div>

      <div className={styles.content}>
        <button
          type="button"
          className={styles.sectionButton}
          aria-expanded={expandedSections.online}
          onClick={() => toggleSection("online")}
        >
          <span className={styles.onlineIndicator} />
          <span>
            ОНЛАЙН
            <span className={styles.statusCount}>
              {onlineParticipants.length}
            </span>
          </span>
        </button>

        <div
          className={`${styles.participantsShell} ${
            expandedSections.online ? "" : styles.participantsShellCollapsed
          }`}
        >
          <div className={styles.participantsList}>
            {onlineParticipants.map((participant) => (
              <Participant
                key={participant.user.id}
                user={participant.user}
                isInVoiceRoom={isUserInVoiceRoom(participant.user)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={styles.sectionButton}
          aria-expanded={expandedSections.away}
          onClick={() => toggleSection("away")}
        >
          <span className={styles.awayIndicator} />
          <span>
            ОТОШЛИ
            <span className={styles.statusCount}>
              {awayParticipants.length}
            </span>
          </span>
        </button>

        <div
          className={`${styles.participantsShell} ${
            expandedSections.away ? "" : styles.participantsShellCollapsed
          }`}
        >
          <div className={styles.participantsList}>
            {awayParticipants.map((participant) => (
              <Participant
                key={participant.user.id}
                user={participant.user}
                isInVoiceRoom={isUserInVoiceRoom(participant.user)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={styles.sectionButton}
          aria-expanded={expandedSections.offline}
          onClick={() => toggleSection("offline")}
        >
          <span className={styles.offlineIndicator} />
          <span>
            ОФЛАЙН
            <span className={styles.statusCount}>
              {offlineParticipants.length}
            </span>
          </span>
        </button>

        <div
          className={`${styles.participantsShell} ${styles.participantsOffline} ${
            expandedSections.offline ? "" : styles.participantsShellCollapsed
          }`}
        >
          <div className={styles.participantsList}>
            {offlineParticipants.map((participant) => (
              <Participant
                key={participant.user.id}
                user={participant.user}
                isInVoiceRoom={isUserInVoiceRoom(participant.user)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(ChatDescription);
