import { makeAutoObservable, runInAction } from "mobx";
import ChatService from "../services/ChatService";
import ChatSocketService from "../services/ChatSocketService";
import ChatActivityStore from "./chatActivityStore";
import ChatMessagesStore from "./chatMessagesStore";
import LocalCacheService from "../services/LocalCacheService";

const normalizeId = (id) => String(id);
const sameId = (left, right) => normalizeId(left) === normalizeId(right);
const CHAT_SESSION_KEYS = ["lastOpenChatId", "activeVoiceRoomChatId"];
const createClientId = () => globalThis.crypto?.randomUUID?.()
  ?? "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });

export default class ChatStore {
  selectedChat = null;
  isOpening = false;
  isConnected = false;
  chats = [];
  currentUser = null;
  chatLoadRequests = new Map();
  chatLoadGeneration = 0;
  presenceListener = null;
  openChatRequestId = 0;
  accountId = null;
  cacheWriteTimer = null;
  cacheWritePromise = Promise.resolve();

  constructor(connectionStore) {
    this.connectionStore = connectionStore;
    this.messages = new ChatMessagesStore();
    this.activity = new ChatActivityStore();
    this.socketService = new ChatSocketService({
      // Keep callback ownership here: these closures always dispatch to the
      // current ChatStore instance, independently of MobX method decoration.
      onConnectionChange: (isConnected) => {
        this.setConnectionState(isConnected);
        this.connectionStore?.setWebsocketConnected(isConnected);
      },
      onMessage: (data) => this.handleSocketMessage(data),
      onOpen: () => this.flushPendingReads(),
    });

    makeAutoObservable(this, {
      messages: false,
      activity: false,
      socketService: false,
      chatLoadRequests: false,
      chatLoadGeneration: false,
      connectionStore: false,
      cacheWriteTimer: false,
      cacheWritePromise: false,
    }, { autoBind: true });
  }

  // Compatibility accessors keep the existing ChatStore public API intact.
  get socket() { return this.socketService.socket; }
  get messagesByChat() { return this.messages.messagesByChat; }
  get lastMessageByChat() { return this.messages.lastMessageByChat; }
  get pendingReadsByChat() { return this.messages.pendingReadsByChat; }
  get lastReadRequestByChat() { return this.messages.lastReadRequestByChat; }
  get presenceByUserId() { return this.activity.presenceByUserId; }
  get voiceParticipantsByChatId() { return this.activity.voiceParticipantsByChatId; }

  get sortedChats() {
    return this.chats.slice().sort((a, b) => {
      const aTime = this.getLastMessage(a.id)?.created_at || a.created_at;
      const bTime = this.getLastMessage(b.id)?.created_at || b.created_at;
      return new Date(bTime) - new Date(aTime);
    });
  }

  setCurrentUser(user) { this.currentUser = user; }
  setPresenceListener(listener) { this.presenceListener = listener; }
  setConnectionState(isConnected) { this.isConnected = isConnected; }

  connect(token) {
    this.connectionStore?.setWebsocketExpected(Boolean(token));
    this.socketService.connect(token);
  }
  disconnect() {
    this.connectionStore?.setWebsocketExpected(false);
    this.socketService.disconnect();
  }
  sendWS(data) { return this.socketService.send(data); }
  sendPresenceHeartbeat() { return this.socketService.sendPresenceHeartbeat(); }

  handleSocketMessage(data) {
    const handlers = {
      message: () => this.handleIncomingMessage(
        data.chat_id,
        data.client_id ? { ...data.payload, client_id: data.client_id } : data.payload,
        data.unread_count,
      ),
      error: () => this.handleMessageError(data),
      messages_read: () => this.handleMessagesRead(data),
      "chat.created": () => this.ensureChatLoaded(data.chat_id, 0),
      "presence.changed": () => this.handlePresenceChanged(data),
      "voice_room.state": () => this.handleVoiceRoomState(data),
    };
    handlers[data.type]?.();
  }

  upsertChat(chat, { prepend = true, unreadCount = chat?.unread_count } = {}) {
    if (chat?.id == null) return;

    const index = this.chats.findIndex((item) => sameId(item.id, chat.id));
    const existing = index >= 0 ? this.chats[index] : null;
    const nextChat = {
      ...existing,
      ...chat,
      unread_count: sameId(this.selectedChat?.id, chat.id)
        ? 0
        : (unreadCount ?? existing?.unread_count ?? 0),
    };
    const remaining = this.chats.filter((item) => !sameId(item.id, chat.id));

    if (prepend || index < 0) {
      this.chats = [nextChat, ...remaining];
    } else {
      remaining.splice(index, 0, nextChat);
      this.chats = remaining;
    }
    this.scheduleCacheWrite();
  }

  setChats(chats) {
    const existingById = new Map(
      this.chats.map((chat) => [normalizeId(chat.id), chat]),
    );
    const uniqueChats = new Map();
    chats.forEach((chat) => {
      const existing = existingById.get(normalizeId(chat.id));
      uniqueChats.set(normalizeId(chat.id), {
        ...existing,
        ...chat,
        unread_count: sameId(this.selectedChat?.id, chat.id)
          ? 0
          : (existing?.unread_count ?? chat.unread_count ?? 0),
      });

      const currentLast = this.getLastMessage(chat.id);
      if (chat.last_message && (!currentLast
        || new Date(chat.last_message.created_at) > new Date(currentLast.created_at))) {
        this.setLastMessage(chat.id, chat.last_message);
      }
    });
    this.chats = Array.from(uniqueChats.values());
    this.scheduleCacheWrite();
  }

  updateChat(chatId, changes) {
    const index = this.chats.findIndex((chat) => sameId(chat.id, chatId));
    if (index >= 0 && Object.entries(changes).some(([key, value]) => this.chats[index][key] !== value)) {
      this.chats[index] = { ...this.chats[index], ...changes };
    }

    if (sameId(this.selectedChat?.id, chatId)
      && Object.entries(changes).some(([key, value]) => this.selectedChat.data[key] !== value)) {
      this.selectedChat = {
        ...this.selectedChat,
        data: { ...this.selectedChat.data, ...changes },
      };
    }
    this.scheduleCacheWrite();
  }

  setUnreadCount(chatId, unreadCount) {
    const count = Math.max(0, unreadCount);
    const chat = this.chats.find((item) => sameId(item.id, chatId));
    const selectedCount = sameId(this.selectedChat?.id, chatId)
      ? this.selectedChat.data.unread_count ?? 0
      : count;
    if ((chat?.unread_count ?? 0) === count && selectedCount === count) return;
    this.updateChat(chatId, { unread_count: count });
  }

  addMessage(chatId, message) { this.messages.addMessage(chatId, message); this.scheduleCacheWrite(); }
  setMessages(chatId, messages) { this.messages.setMessages(chatId, messages); this.scheduleCacheWrite(); }
  mergeMessages(chatId, messages) { this.messages.mergeMessages(chatId, messages); this.scheduleCacheWrite(); }
  removeMessage(chatId, messageId) { this.messages.removeMessage(chatId, messageId); this.scheduleCacheWrite(); }
  getMessages(chatId) { return this.messages.getMessages(chatId); }
  setLastMessage(chatId, message) { this.messages.setLastMessage(chatId, message); this.scheduleCacheWrite(); }
  getLastMessage(chatId) { return this.messages.getLastMessage(chatId); }

  sendMessage(chatId, message) {
    const clientId = createClientId();
    const optimisticMessage = {
      ...message,
      id: `temp:${clientId}`,
      client_id: clientId,
      chat: chatId,
      author: { user: this.currentUser },
      created_at: new Date().toISOString(),
      is_read: false,
      delivery_status: "pending",
    };
    this.addMessage(chatId, optimisticMessage);
    this.setLastMessage(chatId, optimisticMessage);

    if (!this.sendWS({ action: "send_message", chat_id: chatId, client_id: clientId, message })) {
      this.handleMessageError({ chat_id: chatId, client_id: clientId });
      return false;
    }
    return true;
  }

  handleMessageError(data) {
    if (!data.client_id || data.chat_id == null) return;
    this.messages.setDeliveryStatus(data.chat_id, data.client_id, "failed");
    const lastMessage = this.getLastMessage(data.chat_id);
    if (lastMessage?.client_id === data.client_id) {
      this.setLastMessage(data.chat_id, { ...lastMessage, delivery_status: "failed" });
    }
    this.scheduleCacheWrite();
  }

  setVoiceParticipants(chatId, participants = []) {
    this.activity.setVoiceParticipants(chatId, participants);
  }
  getVoiceParticipants(chatId) { return this.activity.getVoiceParticipants(chatId); }
  clearVoiceParticipants(chatId) { this.activity.clearVoiceParticipants(chatId); }
  getUserPresence(user) { return this.activity.getUserPresence(user); }

  handleVoiceRoomState({ chat_id: chatId, participants = [] }) {
    this.setVoiceParticipants(chatId, participants);
  }

  markChatRead(chatId, upToMessageId = null, force = false) {
    const chat = this.chats.find((item) => sameId(item.id, chatId));
    const targetId = upToMessageId ?? this.getLastMessage(chatId)?.id
      ?? this.getMessages(chatId).at(-1)?.id ?? null;

    if (!force && (chat?.unread_count || 0) === 0 && upToMessageId == null) return false;
    if (targetId != null && (this.lastReadRequestByChat[chatId] || 0) >= targetId) {
      this.setUnreadCount(chatId, 0);
      return false;
    }

    this.setUnreadCount(chatId, 0);
    const payload = { action: "read_messages", chat_id: chatId, up_to_message_id: targetId };
    if (!this.sendWS(payload)) {
      this.pendingReadsByChat.set(chatId, payload);
      return false;
    }

    if (targetId != null) this.lastReadRequestByChat[chatId] = targetId;
    this.pendingReadsByChat.delete(chatId);
    return true;
  }

  flushPendingReads() {
    [...this.pendingReadsByChat.entries()].forEach(([chatId, payload]) => {
      if (!this.sendWS(payload)) return;
      if (payload.up_to_message_id != null) {
        this.lastReadRequestByChat[chatId] = payload.up_to_message_id;
      }
      this.pendingReadsByChat.delete(chatId);
    });
  }

  handleIncomingMessage(chatId, message, unreadCount) {
    this.addMessage(chatId, message);
    this.setLastMessage(chatId, message);
    this.ensureChatLoaded(chatId, unreadCount);

    if (message.author?.user?.id === this.currentUser?.id) {
      this.setUnreadCount(chatId, 0);
    } else if (sameId(this.selectedChat?.id, chatId)) {
      this.setUnreadCount(chatId, unreadCount ?? 1);
      this.markChatRead(chatId, message.id);
    } else {
      const chat = this.chats.find((item) => sameId(item.id, chatId));
      this.setUnreadCount(chatId, unreadCount ?? (chat?.unread_count || 0) + 1);
    }
  }

  handleMessagesRead(data) {
    const { ownRead } = this.messages.handleMessagesRead(data, this.currentUser?.id);
    if (ownRead) this.setUnreadCount(data.chat_id, 0);
  }

  handlePresenceChanged(data) {
    const { user_id: userId, status, last_seen: lastSeen } = data;
    const presence = { status, last_online: lastSeen };
    this.activity.setPresence(userId, presence);

    if (this.currentUser?.id === userId) this.currentUser = { ...this.currentUser, ...presence };
    this.chats = this.chats.map((chat) => chat.other_user?.id === userId
      ? { ...chat, other_user: { ...chat.other_user, ...presence } }
      : chat);

    if (this.selectedChat?.data?.other_user?.id === userId) {
      this.selectedChat = {
        ...this.selectedChat,
        data: {
          ...this.selectedChat.data,
          other_user: { ...this.selectedChat.data.other_user, ...presence },
        },
      };
    }
    this.presenceListener?.(data);
  }

  async ensureChatLoaded(chatId, unreadCount = null) {
    const key = normalizeId(chatId);
    const existingChat = this.chats.find((chat) => sameId(chat.id, chatId));
    if (existingChat) return existingChat;

    const pendingRequest = this.chatLoadRequests.get(key);
    if (pendingRequest) return pendingRequest;

    const generation = this.chatLoadGeneration;
    const request = ChatService.getChat(chatId)
      .then(({ data: chat }) => {
        if (generation !== this.chatLoadGeneration) return null;
        if (chat) runInAction(() => this.upsertChat(chat, { unreadCount }));
        return chat ?? null;
      })
      .catch((error) => {
        console.error("Failed to load chat", error);
        return null;
      })
      .finally(() => {
        if (this.chatLoadRequests.get(key) === request) {
          this.chatLoadRequests.delete(key);
        }
      });

    this.chatLoadRequests.set(key, request);
    return request;
  }

  openChat(chat) {
    this.openChatRequestId += 1;
    const unreadCount = chat.unread_count || 0;
    this.selectedChat = { id: chat.id, data: { ...chat, unread_count: 0 } };
    this.upsertChat(chat, { unreadCount: 0 });
    if (unreadCount > 0) this.markChatRead(chat.id, null, true);
  }

  async openPrivateChat(user) {
    const requestId = ++this.openChatRequestId;
    const { data: chat } = await ChatService.openPrivateChat(user.id);
    runInAction(() => {
      if (requestId !== this.openChatRequestId) return;
      this.selectedChat = { id: chat.id, data: { ...chat, unread_count: 0 } };
      this.upsertChat(chat, { unreadCount: 0 });
    });
    return chat;
  }

  async joinAndOpenChat(chatId) {
    if (this.isOpening) return;
    const requestId = ++this.openChatRequestId;
    this.isOpening = true;
    try {
      await ChatService.joinChat(chatId);
      const { data: chat } = await ChatService.getChat(chatId);
      if (requestId === this.openChatRequestId) this.openChat(chat);
    } finally {
      runInAction(() => { this.isOpening = false; });
    }
  }

  removeChat(chatId) {
    this.chats = this.chats.filter((chat) => !sameId(chat.id, chatId));
    this.scheduleCacheWrite();
  }

  async useAccount(accountId, cachedProfile = null) {
    if (this.accountId != null && !sameId(this.accountId, accountId)) this.reset();
    this.accountId = accountId;
    const snapshot = await LocalCacheService.read(accountId);
    if (!snapshot) return cachedProfile;
    runInAction(() => {
      this.chats = Array.isArray(snapshot.chats) ? snapshot.chats : [];
      this.messages.hydrate(snapshot.messages);
    });
    return snapshot.profile ?? cachedProfile;
  }

  setCachedProfile(profile) {
    this.currentUser = profile;
    this.scheduleCacheWrite();
  }

  scheduleCacheWrite() {
    if (this.accountId == null) return;
    clearTimeout(this.cacheWriteTimer);
    this.cacheWriteTimer = setTimeout(() => this.persistCache(), 150);
  }

  persistCache() {
    this.cacheWriteTimer = null;
    const accountId = this.accountId;
    const snapshot = {
      profile: this.currentUser,
      chats: this.chats,
      messages: this.messages.toJSON(),
    };
    this.cacheWritePromise = this.cacheWritePromise
      .then(() => LocalCacheService.write(accountId, snapshot));
    return this.cacheWritePromise;
  }

  reset() {
    clearTimeout(this.cacheWriteTimer);
    this.cacheWriteTimer = null;
    this.selectedChat = null;
    this.isOpening = false;
    this.chats = [];
    this.chatLoadGeneration += 1;
    this.chatLoadRequests.clear();
    this.messages.reset();
    this.activity.reset();
    CHAT_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
  }
}
