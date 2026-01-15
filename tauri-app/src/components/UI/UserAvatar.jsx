import React, { useState } from "react";
import classes from "./UserAvatar.module.css";

const UserAvatar = ({ src, status }) => {
  // console.log("UserAvatar render", user.status);

  return (
    <div className={classes.user_avatar}>
      <img src={src || "/default.jpg"} alt="avatar" />

      {status && status === "online" && <div className={classes.status}></div>}
    </div>
  );
};

export default UserAvatar;
