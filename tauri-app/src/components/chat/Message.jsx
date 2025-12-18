import React, { useState, useContext } from "react";
import classes from "./Message.module.css";
import UserAvatar from "../UI/UserAvatar";
import { Context } from "../../main";

const Message = function ({ author, text }) {
  const { store } = useContext(Context);

  if (author?.user?.id === store?.user?.id) {
    return (
      <div className={classes.message}>
        <UserAvatar src={author?.user?.avatar} />

        <div className={classes.message__bubble}>{text}</div>
      </div>
    );
  } else {
    return (
      <div className={classes.other_message}>
        <div className={classes.other_message__bubble}>{text}</div>
        <UserAvatar src={author?.user?.avatar} />
      </div>
    );
  }
};

export default Message;
