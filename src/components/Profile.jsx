import React, { useContext, useState } from "react";
import UserAvatar from "./UI/UserAvatar";
import { Context } from "../main";
import { observer } from "mobx-react-lite";
import MyModal from "./UI/MyModal/MyModal.jsx";
import SettingsModal from "./SettingsModal";

const Profile = ({
  activeVoiceRoomChatId,
  activeVoiceRoomName,
  onOpenVoiceRoomPanel,
  onLeaveVoiceRoom,
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
            <span className="profile_voice__dot" />
            <span className="profile_voice__text">
              <span className="profile_voice__label">Голосовая комната</span>
              <span className="profile_voice__chat">{activeVoiceRoomName}</span>
            </span>
          </button>

          <button
            className="profile_voice__leave"
            type="button"
            onClick={onLeaveVoiceRoom}
            title="Выйти из голосовой комнаты"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
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

        <img
          src="/settings.svg"
          className="profile__settings_btn"
          onClick={() => setModal(true)}
        ></img>
      </div>

      <MyModal visable={modal} setVisable={setModal}>
        <SettingsModal onClose={() => setModal(false)} />
      </MyModal>
    </div>
  );
};

export default observer(Profile);
