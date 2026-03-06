import React, { useContext, useState } from "react";
import classes from "./SettingsModal.module.css";
import AvatarPicker from "../components/chat/AvatarPicker.jsx";
import { Context } from "../main";

const SettingsModal = function ({ onClose }) {
  const [avatar, setAvatar] = useState(null);
  const { AuthStore } = useContext(Context);
  const login = AuthStore.user.login || "Login";
  const [activeTab, setActiveTab] = useState(null);

  const openTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className={classes.settings_modal}>
      <div className={classes.settings_header}>
        <button onClick={onClose} className={classes.close}>
          <img src="/back.png" />
        </button>
      </div>

      <div className={classes.settings_body}>
        <div className="tab">
          <button
            className={`tablinks ${activeTab === "Profile" ? "active" : ""}`}
            onClick={() => openTab("Profile")}
          >
            Profile
          </button>

          <button
            className={`tablinks ${activeTab === "App" ? "active" : ""}`}
            onClick={() => openTab("App")}
          >
            App
          </button>

          <button
            className={`tablinks ${activeTab === "Device" ? "active" : ""}`}
            onClick={() => openTab("Device")}
          >
            Device
          </button>
        </div>

        {activeTab === "Profile" && (
          <div className="tabcontent">
            <h3>Profile</h3>
            <p>Profile settings.</p>
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
              <h3 className={classes.settings_label}>Profile Editing</h3>

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
            <button onClick={() => AuthStore.logout()} className="logout">
              Logout
            </button>
          </div>
        )}

        {activeTab === "App" && (
          <div className="tabcontent">
            <h3>App</h3>
            <p>App settings.</p>
          </div>
        )}

        {activeTab === "Device" && (
          <div className="tabcontent">
            <h3>Device</h3>
            <p>Device settings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
