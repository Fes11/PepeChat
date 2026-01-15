import React, { useContext, useState } from "react";
import classes from "./SettingsModal.module.css";
import AvatarPicker from "../components/chat/AvatarPicker.jsx";
import { Context } from "../main";

const SettingsModal = function ({ onClose }) {
  const [avatar, setAvatar] = useState(null);
  const { store } = useContext(Context);
  const login = store.user.login || "Login";

  return (
    <div className={classes.settings_modal}>
      <div className={classes.settings_header}>
        <button onClick={onClose} className={classes.close}>
          <img src="./back.png" />
        </button>

        <div className={classes.settings_page}>Profile</div>
        <div className={classes.settings_page}>App</div>
      </div>

      <div className={classes.settings_body}>
        <h3 className={classes.settings_label}>Profile Editing</h3>

        <div className={classes.settings_box}>
          <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />

          <div className={classes.settings_field}>
            <label>@{login}</label>
            <input
              type="text"
              placeholder="Your username"
              className={classes.settings_input}
            />
            <input
              type="email"
              placeholder="Your email"
              className={classes.settings_input}
            />
          </div>
        </div>
        <h3 className={classes.settings_label}>Change password</h3>
        <div className={classes.settings_field}>
          <input
            type="password"
            placeholder="New password"
            className={classes.settings_input}
          />
          <input
            type="password"
            placeholder="Repeat password"
            className={classes.settings_input}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
