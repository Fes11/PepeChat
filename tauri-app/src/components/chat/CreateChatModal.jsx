import React, { useState } from "react";
import classes from "./CreateChatModal.module.css";
import SearchUser from "./SearchUser.jsx";
import AvatarPicker from "./AvatarPicker.jsx";
import Participant from "./Participant.jsx";

const CreateChatModal = function () {
  return (
    <form className={classes.content}>
      <div className={classes.header}>
        <p className={classes.title}>Create new chat</p>
        <button className={classes.close} type="button">
          X
        </button>
      </div>

      <div className={classes.description}>
        <AvatarPicker />

        <div className={classes.input_box}>
          <input
            type="text"
            placeholder="Chat name"
            className={classes.input}
          />
          <SearchUser />
        </div>
      </div>

      <div className={classes.partchipants__list}>
        <p className={classes.partchipants__list_title}>Participants chat: </p>
        {/* <Participant /> */}
      </div>

      <button className={classes.create_chat_btn} type="submit">
        Create chat
      </button>
    </form>
  );
};

export default CreateChatModal;
