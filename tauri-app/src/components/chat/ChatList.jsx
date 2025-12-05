import React, { useState, useEffect } from "react";
import ChatListElement from "./ChatListElement.jsx";
import Profile from "../Profile.jsx";
import Search from "../UI/Input/Search.jsx";
import Select from "../UI/Select.jsx";
import MyModal from "../UI/MyModal/MyModal.jsx";
import CreateChatModal from "./CreateChatModal.jsx";
import ChatServices from "../../services/ChatService.jsx";

const ChatList = ({ onSelectChat }) => {
  const [modal, setModal] = useState(false);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await ChatServices.getChats();
        setChats(response.data.results);
      } catch (error) {
        console.error("Ошибка при получении чатов:", error);
      }
    };

    fetchChats();
  }, []);

  const handleChatCreated = (newChat) => {
    setChats((prev) => [newChat, ...prev]);
  };

  return (
    <div className="chat_list">
      <div className="chat_list__list">
        <MyModal visable={modal} setVisable={setModal}>
          <CreateChatModal
            onClose={() => setModal(false)}
            onChatCreated={handleChatCreated}
          />
        </MyModal>

        <Search placeholder="Search..." />

        <Select>
          <option value="">All chats</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </Select>

        <div className="chat__list__scroll">
          {chats.map((chat) => (
            <ChatListElement key={chat.id} chat={chat} onClick={onSelectChat} />
          ))}
        </div>

        <button onClick={() => setModal(true)} className="chat_list__btn">
          <img src="/plus.svg" alt="Plus" />
          Create chat
        </button>
      </div>

      <Profile />
    </div>
  );
};

export default ChatList;
