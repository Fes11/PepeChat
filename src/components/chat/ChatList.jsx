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
import MyModal from "../UI/MyModal/MyModal.jsx";
import CreateChatModal from "./CreateChatModal.jsx";
import ChatServices from "../../services/ChatService.jsx";
import classes from "./ChatList.module.css";
import { Context } from "../../main.jsx";
import { observer } from "mobx-react-lite";

const ChatList = observer(
  ({
    activeVoiceRoomChatId,
    activeVoiceRoomName,
    onOpenVoiceRoomPanel,
    onLeaveVoiceRoom,
  }) => {
    const { ChatStore } = useContext(Context);
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
        ChatStore.setChats([...ChatStore.chats, ...response.data.results]);

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
    }, [fetchChats]);

    const handleChatCreated = (newChat) => {
      ChatStore.openChat(newChat);
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
          <MyModal visable={modal} setVisable={setModal}>
            <CreateChatModal
              onClose={() => setModal(false)}
              onChatCreated={handleChatCreated}
            />
          </MyModal>

          <Search placeholder="Search..." />

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
                isSelected={
                  String(chat.id) === String(ChatStore.selectedChat?.data?.id)
                }
                isLast={idx === sortedChats.length - 1}
              />
            ))}
            <div ref={loadingRef} className={classes.chat_list__loader}>
              {loading && "Загрузка..."}
            </div>
          </div>

          <button
            onClick={() => setModal(true)}
            className={classes.chat_list__btn}
          >
            <img src="/plus.svg" alt="Plus" />
            Создать чат
          </button>
        </div>

        <Profile
          activeVoiceRoomChatId={activeVoiceRoomChatId}
          activeVoiceRoomName={activeVoiceRoomName}
          onOpenVoiceRoomPanel={onOpenVoiceRoomPanel}
          onLeaveVoiceRoom={onLeaveVoiceRoom}
        />
      </div>
    );
  },
);

export default ChatList;
