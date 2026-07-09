import React from "react";
import classes from "./UserAvatar.module.css";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const UserAvatar = ({ src, status, className }) => {
  const shouldShowStatus = status === "online" || status === "offline";

  return (
    <div className={classes.user_avatar}>
      <img
        src={resolveMediaUrl(src) || "/default.jpg"}
        alt="avatar"
        className={className}
      />

      {shouldShowStatus && (
        <div
          className={
            status === "online" ? classes.status : classes.status_offline
          }
        />
      )}
    </div>
  );
};

export default UserAvatar;
