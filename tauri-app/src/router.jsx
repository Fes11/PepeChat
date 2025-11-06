import { createBrowserRouter } from "react-router-dom"
import Home from "./views/Home"
import Login from "./views/Login"
import RequireAuth from "./components/RequireAuth"

export const router = createBrowserRouter([
  {
    path: "/",
  },
  {
    path: "/login",
    element: <Login />,
  },
])
