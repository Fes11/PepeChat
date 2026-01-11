import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import MessageService from "../../services/MessageService";
import Message from "./Message";
import ChatDescription from "./ChatDescription.jsx";
import Spinner from "../UI/Spiner.jsx";
import ChatAvatar from "../UI/ChatAvatar.jsx";
import UserAvatar from "../UI/UserAvatar.jsx";
import { parseISO, isSameDay } from "date-fns";
import DateDivider from "../UI/DateDivider.jsx";

const ChatWindow = ({ chat, type }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const activeChatId = useRef(chat.id);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    setIsLoading(true);
    isFirstLoad.current = true;
  }, [chat.id]);

  useLayoutEffect(() => {
    if (!listRef.current) return;

    if (isFirstLoad.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      isFirstLoad.current = false;
    }
  }, [messages]);

  useEffect(() => {
    activeChatId.current = chat.id;

    const loadMessages = async () => {
      setIsLoading(true);

      try {
        const res = await MessageService.getMessages(chat.id);
        if (activeChatId.current !== chat.id) return;
        setMessages(res.data.results);
        setNextCursor(res.data.next);
        setHasMore(Boolean(res.data.next));
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [chat.id]);

  const loadMoreMessages = async () => {
    if (!nextCursor || isLoadingMore) return;

    const container = listRef.current;
    const prevScrollHeight = container.scrollHeight;

    setIsLoadingMore(true);

    try {
      const res = await MessageService.getMessagesByUrl(nextCursor);

      setMessages((prev) => [...res.data.results, ...prev]);

      setNextCursor(res.data.next);
      setHasMore(Boolean(res.data.next));

      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const onScroll = () => {
      if (container.scrollTop <= 0 && hasMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore, nextCursor]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    try {
      const res = await MessageService.sendMessage(chat.id, {
        text: inputMessage,
      });

      setMessages((prevMessages) => [...prevMessages, res.data]);
      setInputMessage("");

      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
    }
  };

  return (
    <div className="chat_window">
      <div className="chat">
        <div className="chat__header">
          {type === "chat" ? (
            <ChatAvatar src={chat.avatar} />
          ) : (
            <UserAvatar src={chat.avatar} />
          )}

          <div className="chat__header_info">
            {type === "chat" ? (
              <p className="chat__header_name">{chat.name}</p>
            ) : (
              <p className="chat__header_name">{chat.username}</p>
            )}
            <p className="chat__header_description">online</p>
          </div>
        </div>

        <div className="chat__message_list" ref={listRef}>
          <div className="spacer" />

          {!isLoading && error && (
            <div className="chat__empty">
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="chat__loader">
              <Spinner />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="chat__empty">
              <p>Здесь пока нет сообщений</p>
            </div>
          )}

          {isLoadingMore && !isLoading && (
            <div className="chat__top_loader">
              <Spinner />
            </div>
          )}

          {!isLoading &&
            messages.map((msg, index) => {
              const currentDate = parseISO(msg.created_at);
              const prevMessage = messages[index - 1];
              const prevDate = prevMessage
                ? parseISO(prevMessage.created_at)
                : null;

              const showDate = !prevDate || !isSameDay(currentDate, prevDate);

              return (
                <React.Fragment key={msg.id}>
                  {showDate && <DateDivider date={currentDate} />}
                  <Message message={msg} />
                </React.Fragment>
              );
            })}
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

      {type === "chat" && <ChatDescription key={chat.id} chat={chat} />}
    </div>
  );
};

export default ChatWindow;
