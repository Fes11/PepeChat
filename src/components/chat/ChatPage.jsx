import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ChatPage = observer(() => {
  const { ChatStore } = useContext(Context);
  const selectedChat = ChatStore?.selectedChat;
  const { id } = useParams();

  useEffect(() => {
    if (id && ChatStore.chats.length > 0) {
      const chat = ChatStore.chats.find((c) => c.id === Number(id));
      if (chat) {
        ChatStore.openChat(chat);
      }
    }
  }, [id, ChatStore.chats]);

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
