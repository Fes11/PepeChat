import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Store from "./store/store";

const store = new Store();

export const Context = createContext({
  store,
});

const container = document.getElementById("root");
if (!window._root) {
  window._root = ReactDOM.createRoot(container);
}

window._root.render(
  <React.StrictMode>
    <Context.Provider value={{ store }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Context.Provider>
  </React.StrictMode>
);
