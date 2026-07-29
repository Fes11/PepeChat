import { getCurrentWindow } from "@tauri-apps/api/window";
import { useContext, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../main";
import Logo from "./UI/Logo.jsx";

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

const CustomTitleBar = observer(({ showConnectionStatus = true }) => {
  const { ConnectionStore } = useContext(Context);
  const status = ConnectionStore.status;
  const dragInProgress = useRef(false);

  const startDragging = (event) => {
    if (event.button !== 0 || dragInProgress.current) {
      return;
    }

    dragInProgress.current = true;

    try {
      const appWindow = getCurrentWindow();
      appWindow
        .startDragging()
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.warn("Tauri window action failed: startDragging", error);
          }
        })
        .finally(() => {
          dragInProgress.current = false;
        });
    } catch (error) {
      dragInProgress.current = false;

      if (import.meta.env.DEV) {
        console.warn(
          "Tauri window action is unavailable: startDragging",
          error,
        );
      }
    }
  };

  const toggleMaximize = () => {
    runWindowAction("toggleMaximize");
  };

  return (
    <header
      data-tauri-drag-region
      className="custom_title_bar"
      onDoubleClick={toggleMaximize}
      onMouseDown={startDragging}
    >
      <div className="custom_title_bar__brand">
        <Logo className="custom_title_bar__logo" />
        <span className="custom_title_bar__title">PepeChat</span>
        {showConnectionStatus && (
          <span
            className={`connection_status connection_status--${status}`}
            title={CONNECTION_LABELS[status]}
            aria-label={`Состояние подключения: ${CONNECTION_LABELS[status]}`}
          >
            <span className="connection_status__dot" aria-hidden="true" />
            <span className="connection_status__label">
              {CONNECTION_LABELS[status]}
            </span>
          </span>
        )}
      </div>
      <div
        className="custom_title_bar__controls"
        onDoubleClick={stopWindowDrag}
        onMouseDown={stopWindowDrag}
      >
        <button
          type="button"
          className="custom_title_bar__control"
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
          className="custom_title_bar__control"
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
          className="custom_title_bar__control custom_title_bar__control--close"
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
