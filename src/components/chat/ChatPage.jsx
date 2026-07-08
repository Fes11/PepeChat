import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Room from "./Room.jsx";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ACTIVE_VOICE_ROOM_CHAT_ID_KEY = "activeVoiceRoomChatId";

const ChatPage = observer(() => {
  const { ChatStore } = useContext(Context);
  const selectedChat = ChatStore?.selectedChat;
  const selectedChatData = selectedChat?.data ?? null;
  const selectedChatId = selectedChatData?.id ?? selectedChat?.id ?? null;
  const { id } = useParams();
  const routeChatId = id ? String(id) : null;
  const shouldShowSelectedChat =
    selectedChatData
    && (!routeChatId || String(selectedChatId) === routeChatId);
  const [activeVoiceRoomChatId, setActiveVoiceRoomChatId] = useState(() => {
    return sessionStorage.getItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY);
  });
  const [isVoiceRoomOpen, setIsVoiceRoomOpen] = useState(() => {
    return Boolean(sessionStorage.getItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY));
  });

  const activeVoiceChat = useMemo(() => {
    return ChatStore.chats.find(
      (chat) => String(chat.id) === String(activeVoiceRoomChatId),
    );
  }, [ChatStore.chats, activeVoiceRoomChatId]);

  const activeVoiceRoomName =
    activeVoiceChat?.name
    || activeVoiceChat?.other_user?.username
    || activeVoiceChat?.other_user?.login
    || "Голосовая комната";

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

  useEffect(() => {
    if (id && ChatStore.chats.length > 0) {
      if (String(selectedChatId) === String(id)) return;

      const chat = ChatStore.chats.find((c) => String(c.id) === String(id));
      if (chat) {
        ChatStore.openChat(chat);
      }
    }
  }, [id, selectedChatId, ChatStore, ChatStore.chats]);

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
        onLeaveVoiceRoom={leaveVoiceRoom}
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
