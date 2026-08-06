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
const INITIAL_VOICE_CONNECTION_STATE = {
  isJoining: true,
  latencyMs: null,
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
  const [isChatDescriptionVisible, setIsChatDescriptionVisible] =
    useState(true);
  const voiceRoomRef = useRef(null);
  const [voiceControls, setVoiceControls] = useState(INITIAL_VOICE_CONTROLS);
  const [voiceConnectionState, setVoiceConnectionState] = useState(
    INITIAL_VOICE_CONNECTION_STATE,
  );
  const handleVoiceControlsChange = useCallback((nextControls) => {
    setVoiceControls(nextControls);
  }, []);

  useEffect(() => {
    ChatStore.setVoiceRoomActive(Boolean(activeVoiceRoomChatId));
    return () => ChatStore.setVoiceRoomActive(false);
  }, [ChatStore, activeVoiceRoomChatId]);

  useEffect(() => {
    if (routeChatId) {
      sessionStorage.setItem(LAST_OPEN_CHAT_ID_KEY, routeChatId);
      return;
    }

    const lastOpenChatId = sessionStorage.getItem(LAST_OPEN_CHAT_ID_KEY);
    if (lastOpenChatId) navigate(`/chat/${lastOpenChatId}`, { replace: true });
  }, [routeChatId, navigate]);

  useEffect(() => {
    setIsChatDescriptionVisible(true);
  }, [routeChatId]);

  const closeChat = useCallback(() => {
    sessionStorage.removeItem(LAST_OPEN_CHAT_ID_KEY);
    ChatStore.closeChat();
    navigate("/chat", { replace: true });
  }, [ChatStore, navigate]);

  const handleChatLeft = useCallback((chatId) => {
    if (String(activeVoiceRoomChatId) === String(chatId)) {
      voiceRoomRef.current?.leave();
    }
    ChatStore.removeChat(chatId);
    sessionStorage.removeItem(LAST_OPEN_CHAT_ID_KEY);
    navigate("/chat", { replace: true });
  }, [ChatStore, activeVoiceRoomChatId, navigate]);

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

  const showVoiceRoom = useCallback(() => {
    ChatStore.setVisibleTextChat(null);
    setIsVoiceRoomOpen(true);
  }, [ChatStore]);

  const openVoiceRoom = (chatId) => {
    const nextChatId = String(chatId);
    sessionStorage.setItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY, nextChatId);
    setActiveVoiceRoomChatId(nextChatId);
    showVoiceRoom();
    setVoiceControls(INITIAL_VOICE_CONTROLS);
    setVoiceConnectionState(INITIAL_VOICE_CONNECTION_STATE);
  };

  const leaveVoiceRoom = () => {
    sessionStorage.removeItem(ACTIVE_VOICE_ROOM_CHAT_ID_KEY);
    setActiveVoiceRoomChatId(null);
    setIsVoiceRoomOpen(false);
    setVoiceControls(INITIAL_VOICE_CONTROLS);
    setVoiceConnectionState(INITIAL_VOICE_CONNECTION_STATE);
  };

  const leaveVoiceRoomFromProfile = () => {
    voiceRoomRef.current?.leave();
  };

  const isTextChatVisible = Boolean(
    shouldShowSelectedChat && !isVoiceRoomOpen,
  );

  useEffect(() => {
    ChatStore.setVisibleTextChat(isTextChatVisible ? selectedChatId : null);

    return () => ChatStore.setVisibleTextChat(null);
  }, [ChatStore, isTextChatVisible, selectedChatId]);

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
        onOpenVoiceRoomPanel={showVoiceRoom}
        onLeaveVoiceRoom={leaveVoiceRoomFromProfile}
        voiceControls={voiceControls}
        voiceConnectionState={voiceConnectionState}
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
            onClose={closeChat}
            isDescriptionVisible={isChatDescriptionVisible}
            onHideDescription={() => setIsChatDescriptionVisible(false)}
            onShowDescription={() => setIsChatDescriptionVisible(true)}
            onChatLeft={handleChatLeft}
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
            preserveChatDescription={Boolean(
              selectedChatData?.is_group && isChatDescriptionVisible,
            )}
            onHide={() => setIsVoiceRoomOpen(false)}
            onLeaveRoom={leaveVoiceRoom}
            onControlsChange={handleVoiceControlsChange}
            onConnectionStateChange={setVoiceConnectionState}
          />
        )}
      </div>
    </div>
  );
});

export default ChatPage;
