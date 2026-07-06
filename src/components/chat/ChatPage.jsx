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
  const { id } = useParams();
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
      if (String(selectedChat?.id) === String(id)) return;

      const chat = ChatStore.chats.find((c) => String(c.id) === String(id));
      if (chat) {
        ChatStore.openChat(chat);
      }
    }
  }, [id, selectedChat?.id, ChatStore, ChatStore.chats.length]);

  useEffect(() => {
    if (!activeVoiceRoomChatId || !selectedChat?.id) return;

    if (String(activeVoiceRoomChatId) !== String(selectedChat.id)) {
      setIsVoiceRoomOpen(false);
    }
  }, [activeVoiceRoomChatId, selectedChat?.id]);

  return (
    <div className="chat_page">
      <ChatList
        activeVoiceRoomChatId={activeVoiceRoomChatId}
        activeVoiceRoomName={activeVoiceRoomName}
        onOpenVoiceRoomPanel={() => setIsVoiceRoomOpen(true)}
        onLeaveVoiceRoom={leaveVoiceRoom}
      />

      <div className="chat_page_main">
        {selectedChat ? (
          <ChatWindow
            key={selectedChat.id}
            chat={selectedChat.data}
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
            preserveChatDescription={Boolean(selectedChat?.data?.is_group)}
            onHide={() => setIsVoiceRoomOpen(false)}
            onLeaveRoom={leaveVoiceRoom}
          />
        )}

      </div>
    </div>
  );
});

export default ChatPage;
