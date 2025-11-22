import React, { useState, useEffect } from "react";
import ChatListElement from "./ChatListElement.jsx";
import Profile from "../Profile.jsx";
import Search from "../UI/Input/Search.jsx";
import Select from "../UI/Select.jsx";
import MyModal from "../UI/MyModal/MyModal.jsx";
import CreateChatModal from "./CreateChatModal.jsx";
import ChatServices from "../../services/ChatService.jsx"; // путь к твоему файлу с ChatServices

const ChatList = () => {
  const [modal, setModal] = useState();

  useEffect(() => {
    // Функция для получения чатов и вывода их в консоль
    const fetchChats = async () => {
      try {
        const response = await ChatServices.getChats();
        console.log("Чаты:", response.data); // выводим чаты в консоль
      } catch (error) {
        console.error("Ошибка при получении чатов:", error);
      }
    };

    fetchChats();
  }, []); // пустой массив зависимостей — вызов произойдет один раз при монтировании

  return (
    <div className="chat_list">
      <div className="chat_list__list">
        <MyModal visable={modal} setVisable={setModal}>
          <CreateChatModal />
        </MyModal>

        <Search placeholder="Search..." />

        <Select>
          <option value="">All chats</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </Select>

        <div className="chat__list__scroll">
          <ChatListElement />
          <ChatListElement />
          <ChatListElement />
          <ChatListElement />
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
