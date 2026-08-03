import { makeAutoObservable, runInAction } from "mobx";
import ChatService from "../services/ChatService";
import MessageService from "../services/MessageService";
import ChatSocketService from "../services/ChatSocketService";
import ChatActivityStore from "./chatActivityStore";
import ChatMessagesStore from "./chatMessagesStore";
import LocalCacheService from "../services/LocalCacheService";
import {
  deduplicateChats,
  getChatIdentityKey,
} from "../utils/chatDeduplication.js";
import { getPresencePatch } from "../utils/presence.js";

const normalizeId = (id) => String(id);
const sameId = (left, right) => normalizeId(left) === normalizeId(right);
const CHAT_SESSION_KEYS = ["lastOpenChatId", "activeVoiceRoomChatId"];
const PARTICIPANTS_CACHE_TTL_MS = 5 * 60 * 1000;
const MESSAGES_CACHE_TTL_MS = 30 * 1000;
const createClientId = () => globalThis.crypto?.randomUUID?.()
  ?? "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
  });

export default class ChatStore {
  selectedChat = null;
  visibleTextChatId = null;
  isOpening = false;
  isConnected = false;
  chats = [];
  currentUser = null;
  chatLoadRequests = new Map();
  privateChatLoadRequests = new Map();
  participantsByChatId = {};
  participantsLoadedAtByChatId = {};
  participantLoadRequests = new Map();
  messageFirstPageByChatId = {};
  messageLoadRequests = new Map();
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
      privateChatLoadRequests: false,
      participantLoadRequests: false,
      messageLoadRequests: false,
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

  isTextChatVisible(chatId) {
    return chatId != null
      && this.visibleTextChatId != null
      && sameId(this.visibleTextChatId, chatId);
  }

  setVisibleTextChat(chatId = null) {
    this.visibleTextChatId = chatId;

    if (chatId == null || !sameId(this.selectedChat?.id, chatId)) return;

    const unreadCount = this.chats.find((chat) => sameId(chat.id, chatId))
      ?.unread_count || 0;
    if (unreadCount > 0) this.markChatRead(chatId, null, true);
  }

  get sortedChats() {
    return deduplicateChats(this.chats).sort((a, b) => {
      const aTime = this.getLastMessage(a.id)?.created_at || a.created_at;
      const bTime = this.getLastMessage(b.id)?.created_at || b.created_at;
      return new Date(bTime) - new Date(aTime);
    });
  }

  setCurrentUser(user) { this.currentUser = user; }
  setPresenceListener(listener) { this.presenceListener = listener; }
  setConnectionState(isConnected) {
    const didReconnect = !this.isConnected && isConnected;
    this.isConnected = isConnected;
    if (didReconnect) this.invalidateMessageFirstPages();
  }

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
  setVoiceRoomActive(isActive) {
    this.socketService.setVoiceRoomActive(isActive);
  }

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

    const identityKey = getChatIdentityKey(chat);
    const index = this.chats.findIndex((item) =>
      sameId(item.id, chat.id)
      || getChatIdentityKey(item) === identityKey,
    );
    const existing = index >= 0 ? this.chats[index] : null;
    const nextChat = {
      ...existing,
      ...chat,
      unread_count: this.isTextChatVisible(chat.id)
        ? 0
        : (unreadCount ?? existing?.unread_count ?? 0),
    };
    const remaining = this.chats.filter((item) =>
      !sameId(item.id, chat.id)
      && getChatIdentityKey(item) !== identityKey,
    );

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
    deduplicateChats(chats).forEach((chat) => {
      const existing = existingById.get(normalizeId(chat.id));
      uniqueChats.set(normalizeId(chat.id), {
        ...existing,
        ...chat,
        unread_count: this.isTextChatVisible(chat.id)
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

  getChatParticipants(chatId) {
    return this.participantsByChatId[normalizeId(chatId)] || [];
  }

  async ensureChatParticipants(chatId) {
    const key = normalizeId(chatId);
    const cached = this.getChatParticipants(key);
    const loadedAt = this.participantsLoadedAtByChatId[key] || 0;
    if (loadedAt && Date.now() - loadedAt < PARTICIPANTS_CACHE_TTL_MS) {
      return cached;
    }

    const pendingRequest = this.participantLoadRequests.get(key);
    if (pendingRequest) return pendingRequest;

    const generation = this.chatLoadGeneration;
    const request = ChatService.getChatParticipants(chatId)
      .then(({ data }) => {
        const participants = data.results || [];
        if (generation === this.chatLoadGeneration) {
          runInAction(() => {
            this.participantsByChatId[key] = participants;
            this.participantsLoadedAtByChatId[key] = Date.now();
          });
        }
        return participants;
      })
      .finally(() => {
        if (this.participantLoadRequests.get(key) === request) {
          this.participantLoadRequests.delete(key);
        }
      });

    this.participantLoadRequests.set(key, request);
    return request;
  }

  async ensureMessageFirstPage(chatId) {
    const key = normalizeId(chatId);
    const cachedMessages = this.getMessages(key);
    const pageState = this.messageFirstPageByChatId[key];
    if (pageState && Date.now() - pageState.loadedAt < MESSAGES_CACHE_TTL_MS) {
      return { messages: cachedMessages, next: pageState.next, fromCache: true };
    }

    const pendingRequest = this.messageLoadRequests.get(key);
    if (pendingRequest) return pendingRequest;

    const generation = this.chatLoadGeneration;
    const request = MessageService.getMessages(chatId)
      .then(({ data }) => {
        if (generation === this.chatLoadGeneration) {
          runInAction(() => {
            this.mergeMessages(chatId, data.results.slice().reverse());
            this.messageFirstPageByChatId[key] = {
              next: data.next,
              loadedAt: Date.now(),
            };
          });
        }
        return {
          messages: this.getMessages(key),
          next: data.next,
          fromCache: false,
        };
      })
      .finally(() => {
        if (this.messageLoadRequests.get(key) === request) {
          this.messageLoadRequests.delete(key);
        }
      });

    this.messageLoadRequests.set(key, request);
    return request;
  }

  invalidateMessageFirstPages() {
    this.messageFirstPageByChatId = {};
  }

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
    if (!this.isTextChatVisible(chatId)) return false;

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
    } else if (this.isTextChatVisible(chatId)) {
      this.setUnreadCount(chatId, unreadCount ?? 1);
      this.markChatRead(chatId, message.id);
    } else {
      const chat = this.chats.find((item) => sameId(item.id, chatId));
      this.setUnreadCount(chatId, unreadCount ?? (chat?.unread_count || 0) + 1);
    }
  }

  handleMessagesRead(data) {
    const { ownRead } = this.messages.handleMessagesRead(data, this.currentUser?.id);
    if (ownRead) {
      this.setUnreadCount(data.chat_id, 0);
      return;
    }

    const lastMessage = this.getLastMessage(data.chat_id);
    const lastReadMessageId = data.last_read_message_id;
    const isOwnLastMessage =
      lastMessage?.author?.user?.id != null &&
      String(lastMessage.author.user.id) === String(this.currentUser?.id);
    const lastMessageId = Number(lastMessage?.id);
    const lastReadId = Number(lastReadMessageId);
    const isLastMessageRead = lastMessage?.id != null
      && lastReadMessageId != null
      && (Number.isFinite(lastMessageId) && Number.isFinite(lastReadId)
        ? lastMessageId <= lastReadId
        : String(lastMessage.id) === String(lastReadMessageId));

    if (isOwnLastMessage && isLastMessageRead && !lastMessage.is_read) {
      this.setLastMessage(data.chat_id, { ...lastMessage, is_read: true });
    }
  }

  handlePresenceChanged(data) {
    const { user_id: userId } = data;
    const presence = getPresencePatch(data);
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
    const shouldMarkRead = this.isTextChatVisible(chat.id);
    const nextUnreadCount = shouldMarkRead ? 0 : unreadCount;
    this.selectedChat = {
      id: chat.id,
      data: { ...chat, unread_count: nextUnreadCount },
    };
    this.upsertChat(chat, { unreadCount: nextUnreadCount });
    if (shouldMarkRead && unreadCount > 0) {
      this.markChatRead(chat.id, null, true);
    }
  }

  closeChat() {
    this.openChatRequestId += 1;
    this.selectedChat = null;
    this.visibleTextChatId = null;
  }

  async openPrivateChat(user) {
    const requestId = ++this.openChatRequestId;
    const key = normalizeId(user.id);
    let request = this.privateChatLoadRequests.get(key);

    if (!request) {
      request = ChatService.openPrivateChat(user.id).finally(() => {
        if (this.privateChatLoadRequests.get(key) === request) {
          this.privateChatLoadRequests.delete(key);
        }
      });
      this.privateChatLoadRequests.set(key, request);
    }

    const { data: chat } = await request;
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
    const key = normalizeId(chatId);
    this.chats = this.chats.filter((chat) => !sameId(chat.id, chatId));
    this.messages.removeChat(chatId);
    delete this.participantsByChatId[key];
    delete this.participantsLoadedAtByChatId[key];
    delete this.messageFirstPageByChatId[key];
    this.participantLoadRequests.delete(key);
    this.messageLoadRequests.delete(key);
    this.clearVoiceParticipants(chatId);

    if (sameId(this.selectedChat?.id, chatId)) {
      this.selectedChat = null;
      this.visibleTextChatId = null;
    }
    this.scheduleCacheWrite();
  }

  async useAccount(accountId, cachedProfile = null) {
    if (this.accountId != null && !sameId(this.accountId, accountId)) this.reset();
    this.accountId = accountId;
    const snapshot = await LocalCacheService.read(accountId);
    if (!snapshot) return cachedProfile;
    runInAction(() => {
      this.chats = Array.isArray(snapshot.chats)
        ? deduplicateChats(snapshot.chats)
        : [];
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
    this.visibleTextChatId = null;
    this.isOpening = false;
    this.chats = [];
    this.chatLoadGeneration += 1;
    this.chatLoadRequests.clear();
    this.privateChatLoadRequests.clear();
    this.participantsByChatId = {};
    this.participantsLoadedAtByChatId = {};
    this.participantLoadRequests.clear();
    this.messageFirstPageByChatId = {};
    this.messageLoadRequests.clear();
    this.messages.reset();
    this.activity.reset();
    CHAT_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
  }
}
