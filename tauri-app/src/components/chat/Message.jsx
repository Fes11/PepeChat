import React, { useState, useContext } from "react";
import classes from "./Message.module.css";
import UserAvatar from "../UI/UserAvatar";
import { Context } from "../../main";
import { format, parseISO } from "date-fns";

const Message = function ({ message }) {
  const { store } = useContext(Context);
  const date = format(parseISO(message.created_at), "HH:mm");

  if (message.author?.user?.id === store?.user?.id) {
    return (
      <div className={classes.message}>
        <UserAvatar src={message.author?.user?.avatar} />

        <div className={classes.message__bubble}>
          {message.text}
          <div className={classes.message__time}>{date}</div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={classes.other_message}>
        <div className={classes.other_message__bubble}>{text}</div>
        <UserAvatar src={message.author?.user?.avatar} />
      </div>
    );
  }
};

export default Message;
