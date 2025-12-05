import { createBrowserRouter } from "react-router-dom";
import Login from "./views/Login";
import ChatPage from "./components/chat/ChatPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ChatPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);
