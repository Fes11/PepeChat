import React, { useContext, useEffect, useState } from "react";
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
  voiceConnectionState,
  onToggleVoiceMic,
  onToggleVoiceHeadphones,
  onToggleVoiceCamera,
  onToggleVoiceScreenShare,
}) => {
  const { AuthStore, ChatStore } = useContext(Context);
  const [modal, setModal] = useState(false);
  const [isVoiceParticipantsExpanded, setIsVoiceParticipantsExpanded] =
    useState(false);
  const login = AuthStore.user.login;
  const username = AuthStore.user.username;
  const user = AuthStore.user;
  const isInVoiceRoom = Boolean(activeVoiceRoomChatId);
  const voiceParticipants = isInVoiceRoom
    ? ChatStore.getVoiceParticipants(activeVoiceRoomChatId)
    : [];
  const isVoiceRoomJoining = voiceConnectionState?.isJoining ?? true;
  const voiceRoomLatency = voiceConnectionState?.latencyMs;
  const voiceRoomStatus = isVoiceRoomJoining
    ? "Подключение…"
    : `Подключено${
        Number.isFinite(voiceRoomLatency) ? ` · ${voiceRoomLatency} мс` : ""
      }`;

  useEffect(() => {
    setIsVoiceParticipantsExpanded(false);
  }, [activeVoiceRoomChatId]);

  return (
    <div className={styles.profile}>
      {isInVoiceRoom && (
        <div className={styles.voiceRoom}>
          <div className={styles.voiceRoomHeader}>
            <button
              className={styles.voiceRoomInfo}
              type="button"
              onClick={onOpenVoiceRoomPanel}
              title="Открыть голосовую комнату"
            >
              <span className={styles.voiceRoomText}>
                <span className={styles.voiceRoomName}>
                  {activeVoiceRoomName}
                </span>
                <span className={styles.voiceRoomStatus}>
                  <img src="/voice_call.svg" alt="" /> {voiceRoomStatus}
                </span>
              </span>
            </button>

            <button
              className={`${styles.voiceParticipantsToggle} ${
                isVoiceParticipantsExpanded
                  ? styles.voiceParticipantsToggleExpanded
                  : ""
              }`}
              type="button"
              onClick={() =>
                setIsVoiceParticipantsExpanded((expanded) => !expanded)
              }
              aria-expanded={isVoiceParticipantsExpanded}
              aria-controls="profile-voice-participants"
              title={
                isVoiceParticipantsExpanded
                  ? "Скрыть участников"
                  : "Показать участников"
              }
            >
              <img src="/back.svg" alt="" />
            </button>
          </div>

          {isVoiceParticipantsExpanded && (
            <div
              id="profile-voice-participants"
              className={styles.voiceParticipants}
            >
              {voiceParticipants.length > 0 ? (
                voiceParticipants.map((participant) => {
                  const participantName =
                    participant.user?.username ||
                    participant.user?.login ||
                    "Участник";
                  const headphonesMuted = Boolean(participant.state?.deafened);
                  const microphoneMuted = Boolean(participant.state?.muted);

                  return (
                    <div
                      key={participant.id}
                      className={styles.voiceParticipant}
                    >
                      <Avatar
                        src={participant.user?.avatar}
                        alt={`Аватар пользователя ${participantName}`}
                        size={32}
                        className={
                          participant.state?.speaking
                            ? styles.voiceParticipantSpeaking
                            : undefined
                        }
                      />
                      <span className={styles.voiceParticipantName}>
                        {participantName}
                      </span>
                      <span className={styles.voiceParticipantState}>
                        {headphonesMuted && (
                          <img
                            src="/headphones-off.svg"
                            alt="Наушники выключены"
                            title="Наушники выключены"
                          />
                        )}
                        {microphoneMuted && (
                          <img
                            src="/mic-off.svg"
                            alt="Микрофон выключен"
                            title="Микрофон выключен"
                          />
                        )}
                      </span>
                    </div>
                  );
                })
              ) : (
                <span className={styles.voiceParticipantsEmpty}>
                  {isVoiceRoomJoining
                    ? "Участники загружаются…"
                    : "Нет участников"}
                </span>
              )}
            </div>
          )}

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
          size={45}
        />

        <div className={styles.userInfo}>
          <p className={styles.username}>{username}</p>
          {login && <p className={styles.login}>@{login}</p>}
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
