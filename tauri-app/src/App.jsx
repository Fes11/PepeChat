import { Routes, Route, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useContext, useEffect } from "react";
import { Context } from "./main";
import "./style/App.css";
import Spinner from "./components/UI/Spiner";

import Login from "./components/auth/Login";
import Registration from "./components/auth/Registration";
import ChatPage from "./components/chat/ChatPage";

const App = observer(() => {
  const { store } = useContext(Context);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      store.checkAuth();
    }
  }, []);

  if (store.isLoading) {
    return <Spinner />;
  }

  return (
    <main className="container">
      <Routes>
        <Route
          path="/login"
          element={!store.isAuth ? <Login /> : <Navigate to="/" />}
        />

        <Route
          path="/registration"
          element={!store.isAuth ? <Registration /> : <Navigate to="/" />}
        />

        <Route
          path="/"
          element={store.isAuth ? <ChatPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </main>
  );
});

export default App;
