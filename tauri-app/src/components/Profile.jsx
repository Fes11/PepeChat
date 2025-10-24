import React from "react";


const Profile = () => {
  
  return (
    <div className="profile">
        <div className="profile__avatar"></div>

        <div className="profile__info">
            <p className="profile_username">username</p>
            <p className="profile__status">offline</p>
        </div>

        <img src="/settings.svg" className="profile__settings_btn"></img>
    </div>
  );
};

export default Profile;
