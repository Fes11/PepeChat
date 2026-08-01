import { useContext, useState } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../../main.jsx";
import Participant from "./Participant";
import styles from "./ChatDescription.module.css";

const ChatDescription = ({ participants = [] }) => {
  const { ChatStore } = useContext(Context);
  const [expandedSections, setExpandedSections] = useState({
    online: true,
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

  const offlineParticipants = participantsWithPresence.filter(
    (p) => p.user.status === "offline",
  );

  return (
    <div className={styles.description}>
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
            <span className={styles.statusCount}>{onlineParticipants.length}</span>
          </span>
        </button>

        <div
          className={`${styles.participantsShell} ${
            expandedSections.online ? "" : styles.participantsShellCollapsed
          }`}
        >
          <div className={styles.participantsList}>
            {onlineParticipants.map((participant) => (
              <Participant key={participant.user.id} user={participant.user} />
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
            <span className={styles.statusCount}>{offlineParticipants.length}</span>
          </span>
        </button>

        <div
          className={`${styles.participantsShell} ${
            expandedSections.offline ? "" : styles.participantsShellCollapsed
          }`}
        >
          <div className={styles.participantsList}>
            {offlineParticipants.map((participant) => (
              <Participant key={participant.user.id} user={participant.user} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(ChatDescription);
