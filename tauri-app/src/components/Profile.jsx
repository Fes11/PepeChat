import React, { useContext } from "react";
import UserAvatar from "./UI/UserAvatar";
import { Context } from "../main";
import { observer } from "mobx-react-lite";

const Profile = () => {
  const { store } = useContext(Context);
  const login = store.user.login;
  const username = store.user.username;
  const avatar = store.user.avatar;

  return (
    <div className="profile">
      <UserAvatar src={avatar} width="40px" height="40px" />

      <div className="profile__info">
        <p className="profile_username">@{login}</p>
        <p className="profile__status">{username}</p>
      </div>

      <button onClick={() => store.logout()} className="logout">
        Logout
      </button>
      <img src="/settings.svg" className="profile__settings_btn"></img>
    </div>
  );
};

export default observer(Profile);
