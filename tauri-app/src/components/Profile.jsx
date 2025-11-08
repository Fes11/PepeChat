import React, {useContext} from "react";
import UserAvatar from "./UI/UserAvatar"
import { Context } from "../main";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";

const Profile = () => {
  
  const { store } = useContext(Context);
  console.log("User object:", toJS(store.user));

  return (
    <div className="profile">
        <UserAvatar src="./test_avatar2.jpg" width="40px" height="40px"/>

        <div className="profile__info">
            <p className="profile_username">{toJS(store.user.login)}</p>
            <p className="profile__status">offline</p>
        </div>

        <button onClick={() => store.logout()} className="logout">Logout</button>
        <img src="/settings.svg" className="profile__settings_btn"></img>
    </div>
  );
};

export default observer(Profile);
