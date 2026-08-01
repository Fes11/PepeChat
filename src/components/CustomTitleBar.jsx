import { getCurrentWindow } from "@tauri-apps/api/window";
import { useContext } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../main";
import Logo from "./UI/Logo.jsx";
import styles from "./CustomTitleBar.module.css";

const runWindowAction = (actionName) => {
  try {
    const appWindow = getCurrentWindow();
    appWindow[actionName]().catch((error) => {
      if (import.meta.env.DEV) {
        console.warn(`Tauri window action failed: ${actionName}`, error);
      }
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`Tauri window action is unavailable: ${actionName}`, error);
    }
  }
};

const stopWindowDrag = (event) => {
  event.stopPropagation();
};

const CONNECTION_LABELS = {
  connected: "Подключено",
  reconnecting: "Переподключение",
  offline: "Нет сети",
};

const CONNECTION_STYLES = {
  connected: styles.connectionConnected,
  reconnecting: "",
  offline: styles.connectionOffline,
};

const CustomTitleBar = observer(({ showConnectionStatus = true }) => {
  const { ConnectionStore } = useContext(Context);
  const status = ConnectionStore.status;

  const toggleMaximize = () => {
    runWindowAction("toggleMaximize");
  };

  return (
    <header
      className={styles.titleBar}
      onDoubleClick={toggleMaximize}
    >
      <div
        data-tauri-drag-region
        className={styles.dragRegion}
        aria-hidden="true"
      />
      <div className={styles.brand}>
        <Logo className={styles.logo} />
        <span className={styles.title}>PepeChat</span>
        {showConnectionStatus && (
          <span
            className={`${styles.connectionStatus} ${CONNECTION_STYLES[status] ?? ""}`}
            title={CONNECTION_LABELS[status]}
            aria-label={`Состояние подключения: ${CONNECTION_LABELS[status]}`}
          >
            <span className={styles.connectionDot} aria-hidden="true" />
            <span className={styles.connectionLabel}>
              {CONNECTION_LABELS[status]}
            </span>
          </span>
        )}
      </div>
      <div
        className={styles.controls}
        onDoubleClick={stopWindowDrag}
        onMouseDown={stopWindowDrag}
      >
        <button
          type="button"
          className={styles.control}
          aria-label="Свернуть"
          title="Свернуть"
          onClick={() => runWindowAction("minimize")}
        >
          <span aria-hidden="true">
            <img src="/hide.svg" />
          </span>
        </button>
        <button
          type="button"
          className={styles.control}
          aria-label="Развернуть"
          title="Развернуть"
          onClick={toggleMaximize}
        >
          <span aria-hidden="true">
            <img src="/reveal.svg" />
          </span>
        </button>
        <button
          type="button"
          className={`${styles.control} ${styles.closeControl}`}
          aria-label="Закрыть"
          title="Закрыть"
          onClick={() => runWindowAction("close")}
        >
          <span aria-hidden="true">
            <img src="/close.svg" />
          </span>
        </button>
      </div>
    </header>
  );
});

export default CustomTitleBar;
