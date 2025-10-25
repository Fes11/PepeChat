import React from "react";
import UserAvatar from "./UI/UserAvatar"

const Profile = () => {
  
  return (
    <div className="profile">
        <UserAvatar src="./test_avatar2.jpg" width="40px" height="40px"/>

        <div className="profile__info">
            <p className="profile_username">username</p>
            <p className="profile__status">offline</p>
        </div>

        <img src="/settings.svg" className="profile__settings_btn"></img>
    </div>
  );
};

export default Profile;
