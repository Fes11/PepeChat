import React, { useContext } from "react";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ChatPage = observer(() => {
  const { ChatStore } = useContext(Context);
  const selectedChat = ChatStore?.selectedChat;

  return (
    <div className="chat_page">
      <ChatList />

      {selectedChat ? (
        <ChatWindow
          key={selectedChat.id}
          chat={selectedChat.data}
          type={selectedChat.type}
        />
      ) : (
        <div className="chat_empty">
          <p>Выберите чат</p>
        </div>
      )}
    </div>
  );
});

export default ChatPage;
