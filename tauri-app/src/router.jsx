import { createBrowserRouter } from "react-router-dom"
import Login from "./views/Login"
import Main from "./components/chat/Main.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
  },
  {
    path: "/login",
    element: <Login />,
  },
])
