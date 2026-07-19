import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Room from "../room/Room.jsx";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ACTIVE_VOICE_ROOM_CHAT_ID_KEY = "activeVoiceRoomChatId";
const LAST_OPEN_CHAT_ID_KEY = "lastOpenChatId";

const ChatPage = observer(() => {
  const { ChatStore } = useContext(Context);
  const navigate = useNavigate();
  const selectedChat = ChatStore?.selectedChat;
  const selectedChatData = selectedChat?.data ?? null;
  const selectedChatId = selectedChatData?.id ?? selectedChat?.id ?? null;
  const { id } = useParams();
  const routeChatId = id ? String(id) : null;
  const shouldShowSelectedChat =
    routeChatId &&
    selectedChatData &&
    String(selectedChatId) === routeChatId;
  const [activeVoiceRoomChatId, setActiveVoiceRoomChatId] = useState(() => {
    return sessionStorage.getItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY);
  });
  const [isVoiceRoomOpen, setIsVoiceRoomOpen] = useState(() => {
    return Boolean(sessionStorage.getItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY));
  });
  const voiceRoomRef = useRef(null);

  useEffect(() => {
    if (routeChatId) {
      sessionStorage.setItem(LAST_OPEN_CHAT_ID_KEY, routeChatId);
      return;
    }

    const lastOpenChatId = sessionStorage.getItem(LAST_OPEN_CHAT_ID_KEY);
    if (lastOpenChatId) navigate(`/chat/${lastOpenChatId}`, { replace: true });
  }, [routeChatId, navigate]);

  const activeVoiceChat = useMemo(() => {
    return ChatStore.chats.find(
      (chat) => String(chat.id) === String(activeVoiceRoomChatId),
    );
  }, [ChatStore.chats, activeVoiceRoomChatId]);

  const activeVoiceRoomName =
    activeVoiceChat?.name ||
    activeVoiceChat?.other_user?.username ||
    activeVoiceChat?.other_user?.login ||
    "Голосовая комната";

  const openVoiceRoom = (chatId) => {
    const nextChatId = String(chatId);
    sessionStorage.setItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY, nextChatId);
    setActiveVoiceRoomChatId(nextChatId);
    setIsVoiceRoomOpen(true);
  };

  const leaveVoiceRoom = () => {
    sessionStorage.removeItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY);
    setActiveVoiceRoomChatId(null);
    setIsVoiceRoomOpen(false);
  };

  const leaveVoiceRoomFromProfile = () => {
    voiceRoomRef.current?.leave();
  };

  useEffect(() => {
    if (!routeChatId || String(selectedChatId) === routeChatId) return;

    let cancelled = false;

    const selectRouteChat = async () => {
      let chat = ChatStore.chats.find(
        (item) => String(item.id) === routeChatId,
      );

      if (!chat) {
        await ChatStore.ensureChatLoaded(routeChatId, 0);
        chat = ChatStore.chats.find(
          (item) => String(item.id) === routeChatId,
        );
      }

      if (!cancelled && chat) ChatStore.openChat(chat);
    };

    selectRouteChat();

    return () => {
      cancelled = true;
    };
  }, [routeChatId, selectedChatId, ChatStore]);

  useEffect(() => {
    if (!activeVoiceRoomChatId || !selectedChatId) return;

    if (String(activeVoiceRoomChatId) !== String(selectedChatId)) {
      setIsVoiceRoomOpen(false);
    }
  }, [activeVoiceRoomChatId, selectedChatId]);

  return (
    <div className="chat_page">
      <ChatList
        activeVoiceRoomChatId={activeVoiceRoomChatId}
        activeVoiceRoomName={activeVoiceRoomName}
        onOpenVoiceRoomPanel={() => setIsVoiceRoomOpen(true)}
        onLeaveVoiceRoom={leaveVoiceRoomFromProfile}
      />

      <div className="chat_page_main">
        {shouldShowSelectedChat ? (
          <ChatWindow
            chat={selectedChatData}
            type={selectedChat.type}
            activeVoiceRoomChatId={activeVoiceRoomChatId}
            onOpenVoiceRoom={openVoiceRoom}
          />
        ) : (
          <div className="chat_empty">
            <p>Выберите чат</p>
          </div>
        )}

        {activeVoiceRoomChatId && (
          <Room
            ref={voiceRoomRef}
            key={activeVoiceRoomChatId}
            chatId={activeVoiceRoomChatId}
            isOpen={isVoiceRoomOpen}
            preserveChatDescription={Boolean(selectedChatData?.is_group)}
            onHide={() => setIsVoiceRoomOpen(false)}
            onLeaveRoom={leaveVoiceRoom}
          />
        )}
      </div>
    </div>
  );
});

export default ChatPage;
