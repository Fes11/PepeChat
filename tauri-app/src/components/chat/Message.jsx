import React, { useState, useContext } from "react";
import classes from "./Message.module.css";
import UserAvatar from "../UI/UserAvatar";
import { Context } from "../../main";
import { format, parseISO } from "date-fns";
import ReadMessageCheck from "./ReadMessageCheck";

const Message = function ({ message }) {
  const { AuthStore } = useContext(Context);
  const message_time = format(parseISO(message.created_at), "HH:mm");
  console.log("Message: ", message);

  if (message.author?.user?.id === AuthStore?.user?.id) {
    return (
      <div className={classes.message}>
        <UserAvatar src={message.author?.user.avatar} />

        <div className={classes.message__bubble}>
          {message?.text}
          <div className={classes.message__time}>
            {message_time}
            <ReadMessageCheck isRead={message.is_read} />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={classes.other_message}>
        <div className={classes.other_message__bubble}>
          {message?.text}
          <div className={classes.message__time}>{message_time}</div>
        </div>
        <UserAvatar src={message.author?.user?.avatar} />
      </div>
    );
  }
};

export default Message;
