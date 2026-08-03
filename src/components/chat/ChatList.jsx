import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import ChatListElement from "./ChatListElement.jsx";
import Profile from "../Profile.jsx";
import Search from "../UI/Input/Search.jsx";
import Modal from "../UI/Modal/Modal.jsx";
import CreateChatModal from "./CreateChatModal.jsx";
import ChatServices from "../../services/ChatService.jsx";
import classes from "./ChatList.module.css";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import Logo from "../UI/Logo.jsx";
import ContextMenu from "../UI/ContextMenu.jsx";
import {
  notifyError,
  notifySuccess,
} from "../../notifications/notificationService.js";

const LAST_OPEN_CHAT_ID_KEY = "lastOpenChatId";

const ChatList = observer(
  ({
    activeVoiceRoomChatId,
    activeVoiceRoomName,
    onOpenVoiceRoomPanel,
    onLeaveVoiceRoom,
    voiceControls,
    voiceConnectionState,
    onToggleVoiceMic,
    onToggleVoiceHeadphones,
    onToggleVoiceCamera,
    onToggleVoiceScreenShare,
  }) => {
    const { ChatStore } = useContext(Context);
    const navigate = useNavigate();
    const { id: routeChatId } = useParams();
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);
    const [leavingChatId, setLeavingChatId] = useState(null);
    const sortedChats = ChatStore.sortedChats;
    const contextChat = contextMenu
      ? sortedChats.find(
          (chat) => String(chat.id) === String(contextMenu.chatId),
        )
      : null;

    const loadingRef = useRef();
    const pageRef = useRef(1);
    const loadingRefState = useRef(false);

    const fetchChats = useCallback(async () => {
      if (loadingRefState.current || !hasMore) return;

      loadingRefState.current = true;
      setLoading(true);

      try {
        const response = await ChatServices.getChats(pageRef.current);
        ChatStore.setChats(
          pageRef.current === 1
            ? response.data.results
            : [...ChatStore.chats, ...response.data.results],
        );

        setHasMore(!!response.data.next);
        pageRef.current++;
      } catch (e) {
        console.error(e);
      } finally {
        loadingRefState.current = false;
        setLoading(false);
      }
    }, [ChatStore, hasMore]);

    useEffect(() => {
      fetchChats();
      window.addEventListener("online", fetchChats);
      return () => window.removeEventListener("online", fetchChats);
    }, [fetchChats]);

    const handleChatCreated = (newChat) => {
      ChatStore.upsertChat(newChat);
      navigate(`/chat/${newChat.id}`);
    };

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    const openChatContextMenu = useCallback((event, chat) => {
      if (!chat.is_group) {
        setContextMenu(null);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        chatId: chat.id,
        x: event.clientX,
        y: event.clientY,
      });
    }, []);

    const leaveChat = useCallback(async (chat) => {
      if (!chat || leavingChatId != null) return;

      setLeavingChatId(chat.id);
      try {
        await ChatServices.leaveChat(chat.id);

        if (String(activeVoiceRoomChatId) === String(chat.id)) {
          onLeaveVoiceRoom?.();
        }

        const isOpenChat = String(routeChatId) === String(chat.id);
        ChatStore.removeChat(chat.id);

        if (isOpenChat) {
          sessionStorage.removeItem(LAST_OPEN_CHAT_ID_KEY);
          navigate("/chat", { replace: true });
        }

        notifySuccess(`Вы покинули чат «${chat.name}»`);
      } catch (error) {
        notifyError(error, "Не удалось покинуть чат");
      } finally {
        setLeavingChatId(null);
      }
    }, [
      ChatStore,
      activeVoiceRoomChatId,
      leavingChatId,
      navigate,
      onLeaveVoiceRoom,
      routeChatId,
    ]);

    const contextMenuItems = contextChat
      ? [
          {
            id: "leave-chat",
            label: "Покинуть чат",
            danger: true,
            disabled: leavingChatId != null,
            onSelect: () => leaveChat(contextChat),
          },
        ]
      : [];

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
    }, [fetchChats, hasMore]);

    return (
      <div className={classes.chat_list}>
        <div className={classes.chat_list__content}>
          <Modal
            isOpen={modal}
            onClose={() => setModal(false)}
            size="medium"
            className={classes.create_chat_modal}
            contentFlush
          >
            <CreateChatModal
              onClose={() => setModal(false)}
              onChatCreated={handleChatCreated}
            />
          </Modal>

          <div className={classes.chat_list_header}>
            <Search placeholder="Search..." />

            <button
              onClick={() => setModal(true)}
              className={classes.chat_list__btn}
            >
              <img src="/plus.svg" alt="Plus" />
            </button>
          </div>

          {/* <Select>
          <option value="">All chats</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </Select> */}

          <div className={classes.chat__list__scroll}>
            {sortedChats.map((chat, idx) => (
              <ChatListElement
                key={chat.id}
                chat={chat}
                isSelected={String(chat.id) === String(routeChatId)}
                isLast={idx === sortedChats.length - 1}
                onContextMenu={openChatContextMenu}
              />
            ))}
            <div ref={loadingRef} className={classes.chat_list__loader}>
              {loading && "Загрузка..."}
            </div>
          </div>

          <Profile
            activeVoiceRoomChatId={activeVoiceRoomChatId}
            activeVoiceRoomName={activeVoiceRoomName}
            onOpenVoiceRoomPanel={onOpenVoiceRoomPanel}
            onLeaveVoiceRoom={onLeaveVoiceRoom}
            voiceControls={voiceControls}
            voiceConnectionState={voiceConnectionState}
            onToggleVoiceMic={onToggleVoiceMic}
            onToggleVoiceHeadphones={onToggleVoiceHeadphones}
            onToggleVoiceCamera={onToggleVoiceCamera}
            onToggleVoiceScreenShare={onToggleVoiceScreenShare}
          />
        </div>

        <ContextMenu
          isOpen={Boolean(contextMenu && contextChat)}
          x={contextMenu?.x}
          y={contextMenu?.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      </div>
    );
  },
);

export default ChatList;
