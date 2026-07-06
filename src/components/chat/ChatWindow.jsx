import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useContext,
} from "react";
import { Context } from "../../main.jsx";
import MessageService from "../../services/MessageService";
import ChatServices from "../../services/ChatService.jsx";
import Message from "./Message";
import ChatDescription from "./ChatDescription.jsx";
import Spinner from "../UI/Spiner.jsx";
import ChatAvatar from "../UI/ChatAvatar.jsx";
import UserAvatar from "../UI/UserAvatar.jsx";
import { parseISO, isSameDay, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import DateDivider from "../UI/DateDivider.jsx";
import { observer } from "mobx-react-lite";
import Room from "./Room.jsx";
import { notifyError } from "../../notifications/notificationService.js";

const ACTIVE_VOICE_ROOM_CHAT_ID_KEY = "activeVoiceRoomChatId";

const ChatWindow = observer(({ chat }) => {
  // const [messages, setMessages] = useState([]);
  const { ChatStore } = useContext(Context);
  const messages = ChatStore.getMessages(chat.id);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const activeChatId = useRef(chat.id);
  const [loadMessage, setLoadMessage] = useState(false);
  const [viewRoom, setViewRoom] = useState(() => {
    return sessionStorage.getItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY) === String(chat.id);
  });
  const [participants, setParticipants] = useState([]);

  const getLastOnlineStatus = (last_online) => {
    if (!last_online) return null;

    const date = parseISO(last_online);

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: enUS,
    });
  };

  const otherUser = ChatStore.getUserPresence(chat.other_user);
  const lastOnlineStatus = getLastOnlineStatus(otherUser?.last_online);
  const onlineParticipantsCount = participants.filter((participant) => {
    const user = ChatStore.getUserPresence(participant.user);
    return user?.status === "online";
  }).length;

  const isFirstLoad = useRef(true);

  useEffect(() => {
    setViewRoom(
      sessionStorage.getItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY) === String(chat.id),
    );
  }, [chat.id]);

  const openVoiceRoom = () => {
    sessionStorage.setItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY, String(chat.id));
    setViewRoom(true);
  };

  const closeVoiceRoom = () => {
    sessionStorage.removeItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY);
    setViewRoom(false);
  };

  useEffect(() => {
    if (!chat.is_group) {
      setParticipants([]);
      return;
    }

    let isActual = true;

    const fetchParticipants = async () => {
      try {
        const response = await ChatServices.getChatParticipants(chat.id);
        if (isActual) {
          setParticipants(response.data.results);
        }
      } catch (error) {
        console.error("Ошибка при получении участников чата:", error);
      }
    };

    fetchParticipants();

    return () => {
      isActual = false;
    };
  }, [chat.id, chat.is_group]);

  useEffect(() => {
    setIsLoading(true);
    isFirstLoad.current = true;

    activeChatId.current = chat.id;

    const loadMessages = async () => {
      setIsLoading(true);

      try {
        const res = await MessageService.getMessages(chat.id);
        if (activeChatId.current !== chat.id) return;
        ChatStore.mergeMessages(chat.id, res.data.results.slice().reverse());
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

  useLayoutEffect(() => {
    if (!listRef.current) return;

    if (isFirstLoad.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      isFirstLoad.current = false;
    }
  }, [messages]);

  const loadMoreMessages = async () => {
    if (!nextCursor || isLoadingMore) return;

    const container = listRef.current;
    const prevScrollHeight = container.scrollHeight;

    setIsLoadingMore(true);

    try {
      const res = await MessageService.getMessagesByUrl(nextCursor);

      ChatStore.mergeMessages(chat.id, res.data.results);

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

  useLayoutEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

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
    setLoadMessage(true);

    try {
      e.preventDefault();
      if (!inputMessage.trim()) return;

      const isSent = ChatStore.sendMessage(chat.id, {
        text: inputMessage,
      });

      if (!isSent) {
        throw new Error("WebSocket is not connected");
      }

      setInputMessage("");
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
      notifyError(err, "Не удалось отправить сообщение");
    } finally {
      setLoadMessage(false);
    }
  };

  return (
    <div className="chat_window">
      <div className="chat">
        {viewRoom && (
          <Room
            setViewRoom={setViewRoom}
            onLeaveRoom={closeVoiceRoom}
            chatId={chat.id}
          />
        )}

        <div className="chat__header">
          <div className="chat_header_box">
            {chat.is_group ? (
              <ChatAvatar src={chat?.avatar} />
            ) : (
              <UserAvatar
                src={otherUser?.avatar}
                status={otherUser?.status}
              />
            )}

            <div className="chat__header_info">
              {chat.is_group ? (
                <p className="chat__header_name">{chat?.name}</p>
              ) : (
                <p className="chat__header_name">
                  {otherUser?.username || otherUser?.login}
                </p>
              )}
              {!chat.is_group ? (
                <p className="chat__header_description">
                  {otherUser?.status === "online"
                    ? "online"
                    : (lastOnlineStatus ?? "offline")}
                </p>
              ) : (
                <p className="chat__header_description">
                  Online: {onlineParticipantsCount}
                </p>
              )}
            </div>
          </div>

          <img
            src="/voice_chat.png"
            className="voice_chat_btn"
            onClick={openVoiceRoom}
          />
        </div>
        <div className="chat__message_list" ref={listRef}>
          <div className="spacer" />

          {!isLoading && error && (
            <div className="chat__empty">
              <p>{error.message || "Ошибка загрузки сообщений"}</p>
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
                  <Message message={msg} load={loadMessage} />
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

      {chat.is_group && (
        <ChatDescription
          key={chat.id}
          participants={participants}
        />
      )}
    </div>
  );
});

export default ChatWindow;
