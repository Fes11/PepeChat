import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import authStore from "./store/authStore";
import chatStore from "./store/chatStore";
import messagesStore from "./store/messagesStore";
import mediaStore from "./store/mediaStore";
import { initThemeSettings } from "./theme";
import { NotificationProvider } from "./notifications/NotificationProvider";
import { UpdateProvider } from "./updates/UpdateProvider";

const ChatStore = new chatStore();
const AuthStore = new authStore(ChatStore);
const MessagesStore = new messagesStore();
const MediaStore = new mediaStore();

initThemeSettings();

export const Context = createContext({});

document.addEventListener("contextmenu", (event) => {
  if (
    event.target instanceof Element &&
    event.target.closest("[data-allow-native-context-menu]")
  ) {
    return;
  }

  event.preventDefault();
});

const container = document.getElementById("root");
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}

window._root.render(
  <React.StrictMode>
    <Context.Provider
      value={{ AuthStore, ChatStore, MessagesStore, MediaStore }}
    >
      <BrowserRouter>
        <NotificationProvider>
          <UpdateProvider>
            <App />
          </UpdateProvider>
        </NotificationProvider>
      </BrowserRouter>
    </Context.Provider>
  </React.StrictMode>,
);
