import { getCurrentWindow } from "@tauri-apps/api/window";
import { useContext } from "react";
import { observer } from "mobx-react-lite";
import { Context } from "../main";

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

const CustomTitleBar = observer(() => {
  const { ConnectionStore } = useContext(Context);
  const status = ConnectionStore.status;
  const startDragging = (event) => {
    if (event.button !== 0) {
      return;
    }

    runWindowAction("startDragging");
  };

  const toggleMaximize = () => {
    runWindowAction("toggleMaximize");
  };

  return (
    <header
      className="custom_title_bar"
      data-tauri-drag-region
      onDoubleClick={toggleMaximize}
      onMouseDown={startDragging}
    >
      <div className="custom_title_bar__brand" data-tauri-drag-region>
        <img className="custom_title_bar__logo" src="/logo.svg" alt="" />
        <span className="custom_title_bar__title">PepeChat</span>
        <span
          className={`connection_status connection_status--${status}`}
          title={CONNECTION_LABELS[status]}
          aria-label={`Состояние подключения: ${CONNECTION_LABELS[status]}`}
        >
          <span className="connection_status__dot" aria-hidden="true" />
          <span className="connection_status__label">{CONNECTION_LABELS[status]}</span>
        </span>
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
          <span aria-hidden="true">-</span>
        </button>
        <button
          type="button"
          className="custom_title_bar__control"
          aria-label="Развернуть"
          title="Развернуть"
          onClick={toggleMaximize}
        >
          <span aria-hidden="true">□</span>
        </button>
        <button
          type="button"
          className="custom_title_bar__control custom_title_bar__control--close"
          aria-label="Закрыть"
          title="Закрыть"
          onClick={() => runWindowAction("close")}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </header>
  );
});

export default CustomTitleBar;
