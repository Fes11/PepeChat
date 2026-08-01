import React, { useContext, useState } from "react";
import Avatar from "./UI/Avatar/Avatar";
import { Context } from "../main";
import { observer } from "mobx-react-lite";
import Modal from "./UI/Modal/Modal.jsx";
import SettingsModal from "./SettingsModal";
import RoomActivityPanel from "./room/RoomActivityPanel";
import styles from "./Profile.module.css";

const Profile = ({
  activeVoiceRoomChatId,
  activeVoiceRoomName,
  onOpenVoiceRoomPanel,
  onLeaveVoiceRoom,
  voiceControls,
  onToggleVoiceMic,
  onToggleVoiceHeadphones,
  onToggleVoiceCamera,
  onToggleVoiceScreenShare,
}) => {
  const { AuthStore } = useContext(Context);
  const [modal, setModal] = useState(false);
  const login = AuthStore.user.login;
  const username = AuthStore.user.username;
  const user = AuthStore.user;
  const isInVoiceRoom = Boolean(activeVoiceRoomChatId);

  return (
    <div className={styles.profile}>
      {isInVoiceRoom && (
        <div className={styles.voiceRoom}>
          <button
            className={styles.voiceRoomInfo}
            type="button"
            onClick={onOpenVoiceRoomPanel}
            title="Открыть голосовую комнату"
          >
            <span className={styles.voiceRoomText}>
              <span className={styles.voiceRoomName}>{activeVoiceRoomName}</span>
              <span className={styles.voiceRoomStatus}>
                <img src="/voice_call.svg" /> В голосовой
              </span>
            </span>
          </button>

          <RoomActivityPanel
            compact
            {...voiceControls}
            onToggleHeadphones={onToggleVoiceHeadphones}
            onToggleMic={onToggleVoiceMic}
            onToggleCamera={onToggleVoiceCamera}
            onToggleScreenShare={onToggleVoiceScreenShare}
            onLeave={onLeaveVoiceRoom}
          />
        </div>
      )}

      <div className={styles.user}>
        <Avatar
          src={user.avatar}
          status={user.status}
          alt={`Аватар пользователя ${username || login}`}
          size={40}
        />

        <div className={styles.userInfo}>
          {login && <p className={styles.login}>@{login}</p>}
          <p className={styles.username}>{username}</p>
        </div>

        <button
          className={styles.settingsButton}
          onClick={() => setModal(true)}
        >
          <img src="/settings.svg" />
        </button>
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        size="large"
        contentFlush
      >
        <SettingsModal onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
};

export default observer(Profile);
