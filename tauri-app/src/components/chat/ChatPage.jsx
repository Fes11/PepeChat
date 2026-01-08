import React, { useState } from "react";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="chat_page">
      <ChatList onSelectChat={setSelectedChat} selectedChat={selectedChat} />

      {selectedChat ? (
        <ChatWindow chat={selectedChat} />
      ) : (
        <div className="chat_empty">
          <p>Выберите чат</p>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
