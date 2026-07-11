import { Routes, Route, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useContext, useEffect } from "react";
import { Context } from "./main";
import "./style/App.css";
import Spinner from "./components/UI/Spiner";
import TrayMenu from "./components/tray/TrayMenu";
import CustomTitleBar from "./components/CustomTitleBar";

import Login from "./components/auth/Login";
import Registration from "./components/auth/Registration";
import ChatPage from "./components/chat/ChatPage";
import NotFound404 from "./components/UI/NotFound404";

const isTrayMenuWindow = () =>
  new URLSearchParams(window.location.search).get("tray") === "menu";

const MainApp = observer(() => {
  const { ChatStore, AuthStore, MediaStore } = useContext(Context);

  useEffect(() => {
    const init = async () => {
      await AuthStore.checkAuth();

      if (AuthStore.isAuth) {
        MediaStore.initializeDevices({ requestMicrophone: true });

        const token = localStorage.getItem("token");
        if (token) {
          ChatStore.connect(token);
        }
      }
    };

    init();
  }, []);

  return (
    <div className="app_shell">
      <CustomTitleBar />
      <main className="container">
        {AuthStore.isLoading ? (
          <Spinner />
        ) : (
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
              element={
                AuthStore.isAuth ? <ChatPage /> : <Navigate to="/login" />
              }
            />
            <Route path="*" element={<ChatPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
});

const App = () => (isTrayMenuWindow() ? <TrayMenu /> : <MainApp />);

export default App;
