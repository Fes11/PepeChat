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
  const { ChatStore, AuthStore } = useContext(Context);

  useEffect(() => {
    AuthStore.checkAuth();

    const token = localStorage.getItem("token");
    if (token) {
      ChatStore.connect(token);
    }
  }, []);

  if (AuthStore.isLoading) {
    return <Spinner />;
  }

  return (
    <main className="container">
      <Routes>
        <Route
          path="/login"
          element={!AuthStore.isAuth ? <Login /> : <Navigate to="/" />}
        />

        <Route
          path="/registration"
          element={!AuthStore.isAuth ? <Registration /> : <Navigate to="/" />}
        />

        <Route
          path="/chat/"
          element={AuthStore.isAuth ? <ChatPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </main>
  );
});

export default App;
