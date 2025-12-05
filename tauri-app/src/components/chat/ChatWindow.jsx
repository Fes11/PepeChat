import React, { useEffect, useState } from "react";
import MessageService from "../../services/MessageService";
import Message from "./Message";

const ChatWindow = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await MessageService.getMessages(chat.id);
        setMessages(response.data.results);
      } catch (err) {
        console.error("Ошибка загрузки сообщений:", err);
      }
    };

    loadMessages();
  }, [chat.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      const res = await MessageService.sendMessage(chat.id, {
        text: inputMessage,
      });

      setMessages((prevMessages) => [...prevMessages, res.data]);
      setInputMessage("");
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
    }
  };

  return (
    <div className="chat">
      <div className="chat__header">
        <div className="chat__header_avatar">
          <img src={chat.avatar} alt="Chat Avatar" />
        </div>
        <div className="chat__header_info">
          <p className="chat__header_name">{chat.name}</p>
          <p className="chat__header_description">online</p>
        </div>
      </div>

      <div className="chat__message_list">
        {messages.map((msg) => (
          <Message key={msg.id} user={msg.author} text={msg.text} />
        ))}
      </div>

      <div className="chat__bottom">
        <input
          className="chat__input"
          type="text"
          placeholder="Write a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage(e);
          }}
        />
        <button className="chat__send_btn" onClick={sendMessage}>
          <img src="/paperplane.svg" alt="Send" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
