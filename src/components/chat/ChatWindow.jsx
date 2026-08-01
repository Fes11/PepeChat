import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { Context } from "../../main.jsx";
import MessageService from "../../services/MessageService";
import Message from "../message/Message.jsx";
import ChatDescription from "./ChatDescription.jsx";
import Spinner from "../UI/Spiner.jsx";
import Avatar from "../UI/Avatar/Avatar";
import EmojiPicker from "../UI/EmojiPicker/EmojiPicker.jsx";
import EmojiButton from "../UI/EmojiButton/EmojiButton.jsx";
import { parseISO, isSameDay, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import DateDivider from "../UI/DateDivider.jsx";
import { observer } from "mobx-react-lite";
import { notifyError } from "../../notifications/notificationService.js";
import { getErrorMessage } from "../../utils/errors.js";
import ContextMenu from "../UI/ContextMenu";
import VoiceIcon from "../UI/VoiceIcon.jsx";
import styles from "./ChatWindow.module.css";

const MAX_INPUT_HEIGHT = 200;

const ChatWindow = observer(
  ({ chat, activeVoiceRoomChatId, onOpenVoiceRoom }) => {
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
    const inputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const activeChatId = useRef(chat.id);
    const isLoadingOlderMessages = useRef(false);
    const previousScrollHeight = useRef(0);
    const shouldStickToBottom = useRef(true);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [emojiTab, setEmojiTab] = useState("emoji");
    const participants = ChatStore.getChatParticipants(chat.id);
    const voiceParticipants = ChatStore.getVoiceParticipants(chat.id);
    const visibleVoiceAvatars =
      voiceParticipants.length > 3
        ? voiceParticipants.slice(0, 2)
        : voiceParticipants.slice(0, 3);

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

    const [contextMenu, setContextMenu] = useState(null);
    const [deletingMessageId, setDeletingMessageId] = useState(null);
    const selectedMessage = useMemo(
      () =>
        messages.find(
          (message) => String(message.id) === String(contextMenu?.messageId),
        ),
      [contextMenu?.messageId, messages],
    );

    useEffect(() => {
      setInputMessage("");
      setError(null);
      setNextCursor(null);
      setHasMore(true);
      setIsLoadingMore(false);
      setIsEmojiPickerOpen(false);
      setEmojiTab("emoji");
      setContextMenu(null);
      setDeletingMessageId(null);
      isLoadingOlderMessages.current = false;
      previousScrollHeight.current = 0;
      shouldStickToBottom.current = true;
    }, [chat.id]);

    const resizeMessageInput = useCallback(() => {
      const input = inputRef.current;
      if (!input) return;

      input.style.height = "auto";
      const contentHeight = input.scrollHeight;
      const nextHeight = Math.min(contentHeight, MAX_INPUT_HEIGHT);
      input.style.height = `${nextHeight}px`;
      input.style.overflowY =
        contentHeight >= MAX_INPUT_HEIGHT ? "auto" : "hidden";
    }, []);

    useLayoutEffect(() => {
      resizeMessageInput();
    }, [inputMessage, resizeMessageInput]);

    useEffect(() => {
      if (!isEmojiPickerOpen) return;

      const closeOnOutsideClick = (event) => {
        if (emojiPickerRef.current?.contains(event.target)) return;
        setIsEmojiPickerOpen(false);
      };

      document.addEventListener("mousedown", closeOnOutsideClick);
      return () =>
        document.removeEventListener("mousedown", closeOnOutsideClick);
    }, [isEmojiPickerOpen]);

    const openVoiceRoom = () => {
      onOpenVoiceRoom?.(chat.id);
    };

    useEffect(() => {
      if (!chat.is_group) {
        return;
      }

      ChatStore.ensureChatParticipants(chat.id).catch((error) => {
        console.error("Ошибка при получении участников чата:", error);
      });
    }, [ChatStore, chat.id, chat.is_group]);

    useEffect(() => {
      const hasCachedMessages = ChatStore.getMessages(chat.id).length > 0;
      setIsLoading(!hasCachedMessages);
      isFirstLoad.current = true;

      activeChatId.current = chat.id;

      const loadMessages = async () => {
        setIsLoading(!hasCachedMessages);

        try {
          const res = await ChatStore.ensureMessageFirstPage(chat.id);
          if (activeChatId.current !== chat.id) return;
          setNextCursor(res.next);
          setHasMore(Boolean(res.next));
        } catch (e) {
          console.error(e);
          if (!hasCachedMessages) setError(e);
        } finally {
          setIsLoading(false);
        }
      };

      loadMessages();
    }, [ChatStore, chat.id]);

    const loadMoreMessages = useCallback(async () => {
      if (!nextCursor || isLoadingMore) return;

      const container = listRef.current;
      if (!container) return;

      const prevScrollHeight = container.scrollHeight;

      isLoadingOlderMessages.current = true;
      previousScrollHeight.current = prevScrollHeight;
      setIsLoadingMore(true);

      try {
        const res = await MessageService.getMessagesByUrl(nextCursor);

        if (activeChatId.current !== chat.id) return;

        ChatStore.mergeMessages(chat.id, res.data.results);

        setNextCursor(res.data.next);
        setHasMore(Boolean(res.data.next));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingMore(false);
      }
    }, [ChatStore, chat.id, isLoadingMore, nextCursor]);

    useLayoutEffect(() => {
      const container = listRef.current;
      if (!container) return;

      if (isFirstLoad.current) {
        container.scrollTop = container.scrollHeight;
        isFirstLoad.current = false;
        shouldStickToBottom.current = true;
        return;
      }

      if (isLoadingOlderMessages.current) {
        container.scrollTop =
          container.scrollHeight - previousScrollHeight.current;
        isLoadingOlderMessages.current = false;
        return;
      }

      if (shouldStickToBottom.current) {
        container.scrollTop = container.scrollHeight;
      }
    }, [messages.length]);

    useLayoutEffect(() => {
      const container = listRef.current;
      if (!container || isLoading || isLoadingMore || !hasMore) return;

      if (container.scrollHeight <= container.clientHeight + 1) {
        loadMoreMessages();
      }
    }, [hasMore, isLoading, isLoadingMore, loadMoreMessages, messages.length]);

    useEffect(() => {
      const container = listRef.current;
      if (!container) return;

      const onScroll = () => {
        shouldStickToBottom.current =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          24;

        if (container.scrollTop <= 0 && hasMore) {
          loadMoreMessages();
        }
      };

      container.addEventListener("scroll", onScroll);
      return () => container.removeEventListener("scroll", onScroll);
    }, [hasMore, loadMoreMessages]);

    const sendMessage = async (e) => {
      try {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const isSent = ChatStore.sendMessage(chat.id, {
          text: inputMessage,
        });

        setInputMessage("");
        if (!isSent)
          notifyError(
            new Error("WebSocket is not connected"),
            "Сообщение не доставлено",
          );
      } catch (err) {
        console.error("Ошибка отправки сообщения:", err);
        notifyError(err, "Не удалось отправить сообщение");
      }
    };

    const handleMessageKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsEmojiPickerOpen(false);
        return;
      }

      if (event.key === "Enter" && !event.ctrlKey && !event.isComposing) {
        event.preventDefault();
        sendMessage(event);
      }
    };

    const addEmoji = useCallback((emoji) => {
      const input = inputRef.current;
      const selectionStart = input?.selectionStart ?? 0;
      const selectionEnd = input?.selectionEnd ?? selectionStart;

      setInputMessage((currentMessage) => {
        const nextMessage =
          currentMessage.slice(0, selectionStart) +
          emoji +
          currentMessage.slice(selectionEnd);

        return nextMessage;
      });

      requestAnimationFrame(() => {
        inputRef.current?.focus();
        const nextCursorPosition = selectionStart + emoji.length;
        inputRef.current?.setSelectionRange(
          nextCursorPosition,
          nextCursorPosition,
        );
      });
    }, []);

    const openContextMenu = useCallback((event, message) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        messageId: message.id,
      });
    }, []);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const deleteMessage = useCallback(
      async (messageId) => {
        if (deletingMessageId != null) return;

        setDeletingMessageId(messageId);
        try {
          await MessageService.deleteMessage(chat.id, messageId);
          ChatStore.removeMessage(chat.id, messageId);
        } catch (error) {
          console.error("Ошибка удаления сообщения:", error);
          notifyError(error, "Не удалось удалить сообщение");
        } finally {
          setDeletingMessageId(null);
        }
      },
      [ChatStore, chat.id, deletingMessageId],
    );

    const contextMenuItems = useMemo(() => {
      if (!selectedMessage) return [];

      const messageId = selectedMessage.id;
      const isOwnMessage =
        String(selectedMessage.author?.user?.id) ===
        String(ChatStore.currentUser?.id);

      return [
        {
          id: "delete",
          label: isOwnMessage ? "Удалить" : "Удалить у себя",
          danger: true,
          disabled: deletingMessageId != null,
          onSelect: () => deleteMessage(messageId),
        },
      ];
    }, [deleteMessage, deletingMessageId, selectedMessage]);

    return (
      <div className={styles.window}>
        <div className={styles.chat}>
          <div className={styles.header}>
            <div className={styles.headerMain}>
              {chat.is_group ? (
                <Avatar
                  src={chat?.avatar}
                  alt={`Аватар чата ${chat.name}`}
                  size={40}
                  shape="rounded"
                  fallbackSrc="/default_chat_icon.png"
                />
              ) : (
                <Avatar
                  src={otherUser?.avatar}
                  status={otherUser?.status}
                  alt={`Аватар пользователя ${otherUser?.username || otherUser?.login || "неизвестно"}`}
                />
              )}

              <div className={styles.headerInfo}>
                {chat.is_group ? (
                  <p className={styles.headerName}>{chat?.name}</p>
                ) : (
                  <p className={styles.headerName}>
                    {otherUser?.username || otherUser?.login}
                  </p>
                )}
                {!chat.is_group ? (
                  <p className={styles.headerDescription}>
                    {otherUser?.status === "online"
                      ? "online"
                      : (lastOnlineStatus ?? "offline")}
                  </p>
                ) : (
                  <p className={styles.headerDescription}>
                    Онлайн: {onlineParticipantsCount}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className={`${styles.voiceButton} ${
                String(activeVoiceRoomChatId) === String(chat.id)
                  ? styles.voiceButtonActive
                  : ""
              }`}
              onClick={openVoiceRoom}
              title={`В голосовой комнате: ${voiceParticipants.length}`}
              aria-label="Открыть голосовую комнату"
            >
              {voiceParticipants.length > 0 && (
                <div className={styles.voiceAvatars}>
                  {visibleVoiceAvatars.map((participant) => (
                    <Avatar
                      key={participant.id}
                      src={participant.user?.avatar}
                      alt={`Аватар пользователя ${participant.user?.username || participant.user?.login || "неизвестно"}`}
                      size={18}
                      className={styles.voiceAvatar}
                    />
                  ))}

                  {voiceParticipants.length > 3 && (
                    <span className={styles.voiceCount}>
                      {voiceParticipants.length}
                    </span>
                  )}
                </div>
              )}

              <VoiceIcon large />
            </button>
          </div>
          <div className={styles.messageList} ref={listRef}>
            <div className={styles.spacer} />

            {!isLoading && error && (
              <div className={styles.emptyState}>
                <p>
                  {getErrorMessage(error, "Не удалось загрузить сообщения.")}
                </p>
              </div>
            )}

            {isLoading && (
              <div className={styles.loader}>
                <Spinner />
              </div>
            )}

            {!isLoading && messages.length === 0 && (
              <div className={styles.emptyState}>
                <p>Здесь пока нет сообщений</p>
              </div>
            )}

            {isLoadingMore && !isLoading && (
              <div className={styles.topLoader}>
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
                  <React.Fragment key={msg.client_id || msg.id}>
                    {showDate && (
                      <DateDivider date={currentDate} isFirst={index === 0} />
                    )}
                    <Message
                      message={msg}
                      isLastInList={index === messages.length - 1}
                      onContextMenu={openContextMenu}
                    />
                  </React.Fragment>
                );
              })}
          </div>

          <ContextMenu
            isOpen={Boolean(contextMenu && selectedMessage)}
            x={contextMenu?.x}
            y={contextMenu?.y}
            items={contextMenuItems}
            onClose={closeContextMenu}
          />

          <div className={styles.composer}>
            <div className={styles.inputBox} ref={emojiPickerRef}>
              {isEmojiPickerOpen && (
                <EmojiPicker
                  activeTab={emojiTab}
                  onTabChange={setEmojiTab}
                  onEmojiSelect={addEmoji}
                />
              )}
              <textarea
                ref={inputRef}
                className={styles.input}
                placeholder="Написать сообщение..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleMessageKeyDown}
                rows={1}
              />
              <EmojiButton
                className={styles.emojiButton}
                isOpen={isEmojiPickerOpen}
                ariaLabel="Открыть выбор emoji"
                onClick={() => setIsEmojiPickerOpen((isOpen) => !isOpen)}
              />
            </div>
            <button className={styles.sendButton} onClick={sendMessage}>
              <img src="/paperplane.svg" alt="Send" />
            </button>
          </div>
        </div>

        {chat.is_group && (
          <ChatDescription key={chat.id} participants={participants} />
        )}
      </div>
    );
  },
);

export default ChatWindow;
