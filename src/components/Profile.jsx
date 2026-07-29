import React, { useContext, useState } from "react";
import UserAvatar from "./UI/UserAvatar";
import { Context } from "../main";
import { observer } from "mobx-react-lite";
import Modal from "./UI/Modal/Modal.jsx";
import SettingsModal from "./SettingsModal";
import RoomActivityPanel from "./room/RoomActivityPanel";

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
    <div className="profile">
      {isInVoiceRoom && (
        <div className="profile_voice">
          <button
            className="profile_voice__info"
            type="button"
            onClick={onOpenVoiceRoomPanel}
            title="Открыть голосовую комнату"
          >
            <span className="profile_voice__text">
              <span className="profile_voice__chat">{activeVoiceRoomName}</span>
              <span className="profile_voice__chat_status">
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

      <div className="profile__user">
        <UserAvatar
          src={user.avatar}
          status={user.status}
          width="40px"
          height="40px"
        />

        <div className="profile__info">
          {login && <p className="profile_username">@{login}</p>}
          <p className="profile__status">{username}</p>
        </div>

        <button
          className="profile__settings_btn"
          onClick={() => setModal(true)}
        >
          <img src="/settings.svg" />
        </button>
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        size="large"
        contentClassName="modal_content_flush"
      >
        <SettingsModal onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
};

export default observer(Profile);
