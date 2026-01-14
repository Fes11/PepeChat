import React, { useState } from "react";
import classes from "./UserAvatar.module.css";

const UserAvatar = ({ user }) => {
  // console.log("UserAvatar render", user.status);

  return (
    <div className={classes.user_avatar}>
      <img src={user.avatar || "/default.jpg"} alt="avatar" />

      {user.status === "online" && <div className={classes.status}></div>}
    </div>
  );
};

export default UserAvatar;
