import { Routes, Route, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useContext, useEffect } from "react";
import { Context } from "./main";
import Spinner from "./components/UI/Spiner";
import TrayMenu from "./components/tray/TrayMenu";
import CustomTitleBar from "./components/CustomTitleBar";
import UpdateScreen from "./updates/UpdateScreen";
import { useUpdater } from "./updates/UpdateProvider";

import Login from "./components/auth/Login";
import Registration from "./components/auth/Registration";
import ChatPage from "./components/chat/ChatPage";
import styles from "./App.module.css";

const isTrayMenuWindow = () =>
  new URLSearchParams(window.location.search).get("tray") === "menu";

const MainApp = observer(() => {
  const { ChatStore, AuthStore, MediaStore } = useContext(Context);
  const {
    startupComplete,
    isUpdateScreenVisible,
    runStartupUpdate,
  } = useUpdater();

  useEffect(() => {
    runStartupUpdate();
  }, [runStartupUpdate]);

  useEffect(() => {
    if (!startupComplete) return undefined;

    let isCurrent = true;

    const init = async () => {
      await AuthStore.initializeAuth();

      if (isCurrent && AuthStore.isAuth) {
        MediaStore.initializeDevices({ requestMicrophone: true });

        const token = localStorage.getItem("token");
        if (token) {
          ChatStore.connect(token);
        }
      }
    };

    init();

    return () => {
      isCurrent = false;
    };
  }, [AuthStore, ChatStore, MediaStore, startupComplete]);

  return (
    <div className={styles.appShell}>
      <CustomTitleBar
        showConnectionStatus={startupComplete && !isUpdateScreenVisible}
      />
      <main className={styles.content}>
        {!startupComplete ? (
          <UpdateScreen />
        ) : (
          <>
            {AuthStore.isInitializing ? (
              <div role="status" aria-label="Загрузка приложения">
                <Spinner />
              </div>
            ) : (
              <Routes>
                <Route
                  path="/login"
                  element={
                    !AuthStore.isAuth ? <Login /> : <Navigate to="/chat" />
                  }
                />
                <Route
                  path="/registration"
                  element={
                    !AuthStore.isAuth ? (
                      <Registration />
                    ) : (
                      <Navigate to="/chat" />
                    )
                  }
                />
                <Route
                  path="/chat/:id?"
                  element={
                    AuthStore.isAuth ? <ChatPage /> : <Navigate to="/login" />
                  }
                />
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={AuthStore.isAuth ? "/chat" : "/login"}
                      replace
                    />
                  }
                />
              </Routes>
            )}
            {isUpdateScreenVisible && <UpdateScreen />}
          </>
        )}
      </main>
    </div>
  );
});

const App = () => (isTrayMenuWindow() ? <TrayMenu /> : <MainApp />);

export default App;
