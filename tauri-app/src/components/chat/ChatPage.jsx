import React, { useState } from "react";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import ChatDescription from "./ChatDescription.jsx";

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="chat_page">
      <ChatList onSelectChat={setSelectedChat} />

      {selectedChat ? (
        <ChatWindow chat={selectedChat} />
      ) : (
        <div className="chat_empty">Выберите чат</div>
      )}
      <ChatDescription />
    </div>
  );
};

export default ChatPage;
