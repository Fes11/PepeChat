import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";
import classes from "./TrayMenu.module.css";

const TrayMenu = () => {
  const menuRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("tray-menu-window");

    const menu = menuRef.current;
    if (!menu) return undefined;

    let animationFrameId;
    let lastHeight = 0;

    const resizeWindowToContent = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const height = Math.ceil(menu.getBoundingClientRect().height);
        if (height <= 0 || height === lastHeight) return;

        lastHeight = height;
        invoke("resize_tray_menu", { height }).catch((error) => {
          console.error("Не удалось изменить высоту TrayMenu:", error);
        });
      });
    };

    const resizeObserver = new ResizeObserver(resizeWindowToContent);
    resizeObserver.observe(menu);
    resizeWindowToContent();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.body.classList.remove("tray-menu-window");
    };
  }, []);

  const showMainWindow = () => invoke("show_main_window");
  const hideMenu = () => invoke("hide_tray_menu");
  const quit = () => invoke("quit_from_tray");

  return (
    <main className={classes.menu} ref={menuRef}>
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
