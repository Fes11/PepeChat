import { observer } from "mobx-react-lite";
import "./style/App.css";
import ChatPage from "./components/chat/ChatPage.jsx";
import Login from "./components/auth/Login.jsx";
import { useContext, useEffect } from "react";
import { Context } from "./main";

const App = observer(() => {
  const { store } = useContext(Context);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      store.checkAuth();
    }
  }, []);

  return (
    <main className="container">{store.isAuth ? <ChatPage /> : <Login />}</main>
  );
});

export default App;
