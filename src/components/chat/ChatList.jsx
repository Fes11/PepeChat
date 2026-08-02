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
    const sortedChats = ChatStore.sortedChats;

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
      </div>
    );
  },
);

export default ChatList;
