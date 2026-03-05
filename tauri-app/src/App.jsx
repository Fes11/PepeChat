import { Routes, Route, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useContext, useEffect } from "react";
import { Context } from "./main";
import "./style/App.css";
import Spinner from "./components/UI/Spiner";

import Login from "./components/auth/Login";
import Registration from "./components/auth/Registration";
import ChatPage from "./components/chat/ChatPage";
import NotFound404 from "./components/UI/NotFound404";

const App = observer(() => {
  const { ChatStore, AuthStore } = useContext(Context);

  useEffect(() => {
    const init = async () => {
      await AuthStore.checkAuth();

      if (AuthStore.isAuth) {
        const token = localStorage.getItem("token");
        if (token) {
          ChatStore.connect(token);
        }
      }
    };

    init();
  }, []);

  if (AuthStore.isLoading) {
    return <Spinner />;
  }

  return (
    <main className="container">
      <Routes>
        <Route
          path="/login"
          element={!AuthStore.isAuth ? <Login /> : <Navigate to="/chat" />}
        />
        <Route
          path="/registration"
          element={
            !AuthStore.isAuth ? <Registration /> : <Navigate to="/chat" />
          }
        />
        <Route
          path="/chat/:id?"
          element={AuthStore.isAuth ? <ChatPage /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<ChatPage />} />
      </Routes>
    </main>
  );
});

export default App;
