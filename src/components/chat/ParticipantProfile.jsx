import React, { useContext, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../UI/Avatar/Avatar";
import { Context } from "../../main";
import styles from "./ParticipantProfile.module.css";

const ParticipantProfile = forwardRef(({ user, style }, ref) => {
  const { AuthStore } = useContext(Context);
  const { ChatStore } = useContext(Context);
  const navigate = useNavigate();

  const handleOpenPrivateChat = async (event) => {
    event.stopPropagation();

    const chat = await ChatStore.openPrivateChat(user);
    if (chat?.id) {
      navigate(`/chat/${chat.id}`);
    }
  };

  return (
    <div className={styles.profile} ref={ref} style={style}>
      <div className={styles.header}>
        <Avatar
          src={user.avatar}
          status={user.status}
          alt={`Аватар пользователя ${user.username || user.login}`}
          size={50}
        />
        <div className={styles.headerContent}>
          {user.username && (
            <p className={styles.username}>{user.username}</p>
          )}
          {user.login && (
            <p className={styles.login}>@{user.login}</p>
          )}
        </div>
      </div>

      {user.descriptions && (
        <p className={styles.description}>{user.descriptions}</p>
      )}

      {AuthStore.user.id !== user.id && (
        <button
          className={styles.sendMessageButton}
          onClick={handleOpenPrivateChat}
        >
          Написать
        </button>
      )}
    </div>
  );
});

ParticipantProfile.displayName = "ParticipantProfile";

export default ParticipantProfile;
