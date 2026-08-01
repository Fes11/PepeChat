import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatList from "./ChatList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Room from "../room/Room.jsx";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";
import styles from "./ChatPage.module.css";

const ACTIVE_VOICE_ROOM_CHAT_ID_KEY = "activeVoiceRoomChatId";
const LAST_OPEN_CHAT_ID_KEY = "lastOpenChatId";
const INITIAL_VOICE_CONTROLS = {
  micMuted: false,
  headphonesMuted: false,
  cameraEnabled: false,
  screenShareEnabled: false,
};

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
  const [voiceControls, setVoiceControls] = useState(INITIAL_VOICE_CONTROLS);
  const handleVoiceControlsChange = useCallback((nextControls) => {
    setVoiceControls(nextControls);
  }, []);

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
    setVoiceControls(INITIAL_VOICE_CONTROLS);
  };

  const leaveVoiceRoom = () => {
    sessionStorage.removeItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY);
    setActiveVoiceRoomChatId(null);
    setIsVoiceRoomOpen(false);
    setVoiceControls(INITIAL_VOICE_CONTROLS);
  };

  const leaveVoiceRoomFromProfile = () => {
    voiceRoomRef.current?.leave();
  };

  useEffect(() => {
    if (!routeChatId || String(selectedChatId) === routeChatId) return;

    let cancelled = false;

    const selectRouteChat = async () => {
      const chat =
        ChatStore.chats.find((item) => String(item.id) === routeChatId) ??
        (await ChatStore.ensureChatLoaded(routeChatId, 0));

      if (cancelled) return;

      if (chat) {
        ChatStore.openChat(chat);
        return;
      }

      if (sessionStorage.getItem(LAST_OPEN_CHAT_ID_KEY) === routeChatId) {
        sessionStorage.removeItem(LAST_OPEN_CHAT_ID_KEY);
      }
      navigate("/chat", { replace: true });
    };

    selectRouteChat();

    return () => {
      cancelled = true;
    };
  }, [routeChatId, selectedChatId, ChatStore, navigate]);

  useEffect(() => {
    if (!activeVoiceRoomChatId || !selectedChatId) return;

    if (String(activeVoiceRoomChatId) !== String(selectedChatId)) {
      setIsVoiceRoomOpen(false);
    }
  }, [activeVoiceRoomChatId, selectedChatId]);

  return (
    <div className={styles.page}>
      <ChatList
        activeVoiceRoomChatId={activeVoiceRoomChatId}
        activeVoiceRoomName={activeVoiceRoomName}
        onOpenVoiceRoomPanel={() => setIsVoiceRoomOpen(true)}
        onLeaveVoiceRoom={leaveVoiceRoomFromProfile}
        voiceControls={voiceControls}
        onToggleVoiceMic={() => voiceRoomRef.current?.toggleMic()}
        onToggleVoiceHeadphones={() =>
          voiceRoomRef.current?.toggleHeadphones()
        }
        onToggleVoiceCamera={() => voiceRoomRef.current?.toggleCamera()}
        onToggleVoiceScreenShare={() =>
          voiceRoomRef.current?.toggleScreenShare()
        }
      />

      <div className={styles.main}>
        {shouldShowSelectedChat ? (
          <ChatWindow
            chat={selectedChatData}
            type={selectedChat.type}
            activeVoiceRoomChatId={activeVoiceRoomChatId}
            onOpenVoiceRoom={openVoiceRoom}
          />
        ) : (
          <div className={styles.emptyState}>
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
            onControlsChange={handleVoiceControlsChange}
          />
        )}
      </div>
    </div>
  );
});

export default ChatPage;
