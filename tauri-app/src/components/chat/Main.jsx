import React from "react";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import ChatDescription from "./ChatDescription.jsx";

const Main = () => {
  return (
    <div className="main">
        <ChatList />
        <ChatWindow />
        <ChatDescription />
    </div>
  );
};

export default Main;
