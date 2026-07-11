import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import classes from "./TrayMenu.module.css";

const TrayMenu = () => {
  useEffect(() => {
    document.body.classList.add("tray-menu-window");

    return () => {
      document.body.classList.remove("tray-menu-window");
    };
  }, []);

  const showMainWindow = () => invoke("show_main_window");
  const hideMenu = () => invoke("hide_tray_menu");
  const quit = () => invoke("quit_from_tray");

  return (
    <main className={classes.menu}>
      <header className={classes.header}>
        <img className={classes.logo} src="/default_chat_icon.png" alt="" />
        <div className={classes.titleBox}>
          <span className={classes.title}>PepeChat</span>
        </div>
      </header>

      <div className={classes.actions}>
        <button
          className={classes.action}
          type="button"
          onClick={showMainWindow}
        >
          <span className={classes.icon}>↗</span>
          <span>Открыть PepeChat</span>
        </button>
        <button className={classes.action} type="button" onClick={hideMenu}>
          <span className={classes.icon}>−</span>
          <span>Скрыть меню</span>
        </button>
        <button
          className={`${classes.action} ${classes.danger}`}
          type="button"
          onClick={quit}
        >
          <span className={classes.icon}>×</span>
          <span>Выйти</span>
        </button>
      </div>
    </main>
  );
};

export default TrayMenu;
