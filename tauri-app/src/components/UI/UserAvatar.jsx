import React, { useState } from "react";
import classes from "./UserAvatar.module.css";

const UserAvatar = function ({ src }) {
  return (
    <div className={classes.user_avatar}>
      <img src={src || "/default.jpg"} />
    </div>
  );
};

export default UserAvatar;
