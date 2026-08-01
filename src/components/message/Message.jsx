import React, { useState, useContext } from "react";
import classes from "./Message.module.css";
import Avatar from "../UI/Avatar/Avatar";
import { Context } from "../../main";
import { format, parseISO } from "date-fns";
import ReadMessageCheck from "../chat/ReadMessageCheck";

const Message = function ({ message, isLastInList = false, onContextMenu }) {
  const { AuthStore } = useContext(Context);
  const message_time = format(parseISO(message.created_at), "HH:mm");
  const lastMessageClass = isLastInList ? ` ${classes.last_message}` : "";
  const authorName =
    message.author?.user?.username ||
    message.author?.user?.login ||
    message.author?.user?.name ||
    "Пользователь";
  const isOwnMessage =
    message.author?.user?.id != null &&
    String(message.author.user.id) === String(AuthStore?.user?.id);

  if (!isOwnMessage) {
    return (
      <div
        className={`${classes.other_message}${lastMessageClass}`}
        onContextMenu={(event) => onContextMenu?.(event, message)}
      >
        <div className={classes.other_message__bubble}>
          {/* <span className={classes.message__author}>{authorName}</span> */}
          {message?.text}
          <div className={classes.message__time}>{message_time}</div>
        </div>
        <Avatar
          src={message.author?.user?.avatar}
          size={35}
          alt={`Аватар пользователя ${message.author?.user?.username || message.author?.user?.login || "неизвестно"}`}
        />
      </div>
    );
  } else {
    return (
      <div
        className={`${classes.message}${lastMessageClass}`}
        onContextMenu={(event) => onContextMenu?.(event, message)}
      >
        <Avatar
          src={message.author?.user?.avatar}
          size={35}
          alt={`Аватар пользователя ${message.author?.user?.username || message.author?.user?.login || "неизвестно"}`}
        />

        <div className={classes.message__bubble}>
          {message?.text}
          <div className={classes.message__time}>
            {message_time}
            <ReadMessageCheck
              isRead={message.is_read}
              deliveryStatus={message.delivery_status}
            />
          </div>
        </div>
      </div>
    );
  }
};

export default Message;
