import React from "react";
import classes from "./UserAvatar.module.css";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const UserAvatar = ({ src, status, className }) => {
  // console.log("UserAvatar render", user.status);

  return (
    <div className={classes.user_avatar}>
      <img
        src={resolveMediaUrl(src) || "/default.jpg"}
        alt="avatar"
        className={className}
      />

      {status && status === "online" && <div className={classes.status}></div>}
    </div>
  );
};

export default UserAvatar;
