import React, { useState, useContext } from "react";
import classes from "./Message.module.css";
import UserAvatar from "../UI/UserAvatar";
import { Context } from "../../main";
import { format, parseISO } from "date-fns";
import ReadMessageCheck from "../chat/ReadMessageCheck";

const Message = function ({ message, load, isLastInList = false }) {
  const { AuthStore } = useContext(Context);
  const message_time = format(parseISO(message.created_at), "HH:mm");
  const lastMessageClass = isLastInList ? ` ${classes.last_message}` : "";

  if (message.author?.user?.id !== AuthStore?.user?.id) {
    return (
      <div className={`${classes.other_message}${lastMessageClass}`}>
        <div className={classes.other_message__bubble}>
          {message?.text}
          <div className={classes.message__time}>{message_time}</div>
        </div>
        <UserAvatar src={message.author?.user?.avatar} />
      </div>
    );
  } else {
    return (
      <div className={`${classes.message}${lastMessageClass}`}>
        <UserAvatar src={message.author?.user.avatar} />

        <div className={classes.message__bubble}>
          {message?.text}
          <div className={classes.message__time}>
            {message_time}
            <ReadMessageCheck isRead={message.is_read} load={load} />
          </div>
        </div>
      </div>
    );
  }
};

export default Message;
