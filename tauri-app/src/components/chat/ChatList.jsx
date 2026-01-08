import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatListElement from "./ChatListElement.jsx";
import Profile from "../Profile.jsx";
import Search from "../UI/Input/Search.jsx";
import Select from "../UI/Select.jsx";
import MyModal from "../UI/MyModal/MyModal.jsx";
import CreateChatModal from "./CreateChatModal.jsx";
import ChatServices from "../../services/ChatService.jsx";
import classes from "./ChatList.module.css";
import ChatElementLoader from "../UI/ChatElementLoader.jsx";

const ChatList = ({ onSelectChat, selectedChat }) => {
  const [modal, setModal] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef();
  const pageRef = useRef(1);
  const loadingRefState = useRef(false);

  const fetchChats = async () => {
    if (loadingRefState.current || !hasMore) return;

    loadingRefState.current = true;
    setLoading(true);

    try {
      const response = await ChatServices.getChats(pageRef.current);

      setChats((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]));
        response.data.results.forEach((c) => map.set(c.id, c));
        return Array.from(map.values());
      });

      setHasMore(!!response.data.next);
      pageRef.current++;
    } catch (e) {
      console.error(e);
    } finally {
      loadingRefState.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleChatCreated = (newChat) => {
    setChats((prev) => [newChat, ...prev]);
  };

  useEffect(() => {
    const observerInstance = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        fetchChats();
      }
    });

    if (loadingRef.current) {
      observerInstance.observe(loadingRef.current);
    }

    return () => observerInstance.disconnect();
  }, [hasMore]);

  return (
    <div className={classes.chat_list}>
      <div className={classes.chat_list__content}>
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

        <div className={classes.chat__list__scroll}>
          {chats.map((chat, idx) => (
            <ChatListElement
              key={chat.id}
              chat={chat}
              onClick={onSelectChat}
              isSelected={chat.id === selectedChat?.id}
              isLast={idx === chats.length - 1}
            />
          ))}

          <div ref={loadingRef}>{loading && <ChatElementLoader />}</div>
        </div>

        <button
          onClick={() => setModal(true)}
          className={classes.chat_list__btn}
        >
          <img src="/plus.svg" alt="Plus" />
          Create chat
        </button>
      </div>

      <Profile />
    </div>
  );
};

export default ChatList;
