import React, { useContext, useState } from "react";
import UserAvatar from "./UI/UserAvatar";
import { Context } from "../main";
import { observer } from "mobx-react-lite";
import MyModal from "./UI/MyModal/MyModal.jsx";
import SettingsModal from "./SettingsModal";

const Profile = () => {
  const { AuthStore } = useContext(Context);
  const [modal, setModal] = useState(false);
  const login = AuthStore.user.login;
  const username = AuthStore.user.username;
  const user = AuthStore.user;

  return (
    <div className="profile">
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

      <MyModal visable={modal} setVisable={setModal}>
        <SettingsModal onClose={() => setModal(false)} />
      </MyModal>
    </div>
  );
};

export default observer(Profile);
