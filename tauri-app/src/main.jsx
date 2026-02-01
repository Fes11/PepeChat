import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import authStore from "./store/authStore";
import chatStore from "./store/chatStore";
import messagesStore from "./store/messagesStore";

const AuthStore = new authStore();
const ChatStore = new chatStore();
ChatStore.setCurrentUser(AuthStore.user);
const MessagesStore = new messagesStore();

authStore.chatStore = ChatStore;

export const Context = createContext({
  AuthStore,
  ChatStore,
});

const container = document.getElementById("root");
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}

window._root.render(
  <React.StrictMode>
    <Context.Provider value={{ AuthStore, ChatStore }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Context.Provider>
  </React.StrictMode>,
);
