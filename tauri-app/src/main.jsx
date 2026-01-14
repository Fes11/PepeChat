import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Store from "./store/store";
import ChatStore from "./store/chatStore";

const store = new Store();
const chatStore = new ChatStore();

store.chatStore = chatStore;

export const Context = createContext({
  store,
  chatStore,
});

const container = document.getElementById("root");
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}

window._root.render(
  <React.StrictMode>
    <Context.Provider value={{ store, chatStore }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Context.Provider>
  </React.StrictMode>
);
