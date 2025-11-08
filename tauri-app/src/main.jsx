import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Store from "./store/store";

const store = new Store();

export const Context = createContext({
  store,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <Context.Provider value={{ store }}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Context.Provider>
);
