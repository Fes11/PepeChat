import { makeAutoObservable, runInAction } from "mobx";
import ChatService from "../services/ChatService";
import { refreshAccessToken, redirectToLogin } from "../api";
import { WS_BASE_URL } from "../config/env";

const HEARTBEAT_INTERVAL = 20_000;
const normalizeId = (id) => String(id);

export default class ChatStore {
  selectedChat = null;
  isOpening = false;
  socket = null;
  isConnected = false;
  chats = [];
  messagesByChat = {};
  lastMessageByChat = {};
  currentUser = null;
  loadingChatIds = new Set();
  socketToken = null;
  reconnectTimer = null;
  shouldReconnect = false;
  pendingReadsByChat = new Map();
  lastReadRequestByChat = {};
  presenceByUserId = {};
  voiceParticipantsByChatId = {};
  presenceListener = null;
  heartbeatTimer = null;
  openChatRequestId = 0;

  setCurrentUser(user) {
    this.currentUser = user;
  }

  setPresenceListener(listener) {
    this.presenceListener = listener;
  }

  constructor() {
    makeAutoObservable(this);
  }

  sendWS(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(data));
    return true;
  }

  get sortedChats() {
    return this.chats.slice().sort((a, b) => {
      const aTime = this.lastMessageByChat[a.id]?.created_at || a.created_at;
      const bTime = this.lastMessageByChat[b.id]?.created_at || b.created_at;
      return new Date(bTime) - new Date(aTime);
    });
  }

  dedupeChats() {
    const uniqueById = new Map();

    this.chats.forEach((chat) => {
      if (!chat?.id) return;

      const chatId = normalizeId(chat.id);
      const existing = uniqueById.get(chatId);
      uniqueById.set(chatId, { ...existing, ...chat });
    });

    this.chats = Array.from(uniqueById.values());
  }

  upsertChat(chat, options = {}) {
    if (!chat?.id) return;

    const { prepend = true, unreadCount = chat.unread_count } = options;
    const chatId = normalizeId(chat.id);
    const existingIndex = this.chats.findIndex(
      (item) => normalizeId(item.id) === chatId,
    );
    const existing = existingIndex >= 0 ? this.chats[existingIndex] : null;
    const chatsWithoutCurrent = this.chats.filter(
      (item) => normalizeId(item.id) !== chatId,
    );
    const nextChat = {
      ...existing,
      ...chat,
      unread_count:
        normalizeId(this.selectedChat?.id) === chatId
          ? 0
          : (unreadCount ?? existing?.unread_count ?? chat.unread_count ?? 0),
    };

    if (prepend || existingIndex < 0) {
      this.chats = [nextChat, ...chatsWithoutCurrent];
    } else {
      const nextChats = [...chatsWithoutCurrent];
      nextChats.splice(existingIndex, 0, nextChat);
      this.chats = nextChats;
    }

    this.dedupeChats();
  }

  setChats(chats) {
    const existingById = new Map(
      this.chats.map((chat) => [normalizeId(chat.id), chat]),
    );
    const uniqueChats = new Map();

    chats.forEach((chat) => {
      const chatId = normalizeId(chat.id);
      const existing = existingById.get(chatId);
      const mergedChat = {
        ...existing,
        ...chat,
        unread_count:
          normalizeId(this.selectedChat?.id) === chatId
            ? 0
            : (existing?.unread_count ?? chat.unread_count ?? 0),
      };

      uniqueChats.set(chatId, mergedChat);

      if (chat.last_message) {
        const currentLastMessage = this.lastMessageByChat[chat.id];
        if (
          !currentLastMessage
          || new Date(chat.last_message.created_at)
            > new Date(currentLastMessage.created_at)
        ) {
          this.lastMessageByChat[chat.id] = chat.last_message;
        }
      }
    });

    this.chats = Array.from(uniqueChats.values());
    this.dedupeChats();
  }

  connect(token) {
    if (this.socket || !token) return;

    this.socketToken = token;
    this.shouldReconnect = true;

    const wsUrl = `${WS_BASE_URL}/ws/`;
    this.socket = new WebSocket(wsUrl, ["access-token", token]);

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected");
      this.isConnected = true;
      this.startHeartbeat();
      this.sendPresenceHeartbeat();
      this.flushPendingReads();
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS message:", data);

      if (data.type === "message") {
        this.handleIncomingMessage(
          data.chat_id,
          data.payload,
          data.unread_count,
        );
      }

      if (data.type === "messages_read") {
        this.handleMessagesRead(data);
      }

      if (data.type === "presence.changed") {
        this.handlePresenceChanged(data);
      }

      if (data.type === "voice_room.state") {
        this.handleVoiceRoomState(data);
      }
    };

    this.socket.onclose = (event) => {
      console.log("❌ WebSocket disconnected");
      this.isConnected = false;
      this.socket = null;
      this.stopHeartbeat();

      if (this.shouldReconnect && !this.reconnectTimer) {
        this.scheduleReconnect(event.code);
      }
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.socketToken = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async scheduleReconnect(closeCode) {
    if (closeCode === 4401) {
      try {
        this.socketToken = await refreshAccessToken();
      } catch (error) {
        this.shouldReconnect = false;
        redirectToLogin();
        return;
      }
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.socketToken);
    }, 1000);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(
      () => this.sendPresenceHeartbeat(),
      HEARTBEAT_INTERVAL,
    );
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  sendPresenceHeartbeat() {
    return this.sendWS({ action: "presence.heartbeat" });
  }

  addMessage(chatId, message) {
    if (!this.messagesByChat[chatId]) {
      this.messagesByChat[chatId] = [];
    }

    const messageId = normalizeId(message.id);
    if (
      this.messagesByChat[chatId].some(
        (item) => normalizeId(item.id) === messageId,
      )
    ) {
      return;
    }

    this.messagesByChat[chatId].push(message);
  }

  setMessages(chatId, messages) {
    const uniqueMessages = new Map();

    messages.forEach((message) => {
      const messageId = normalizeId(message.id);
      const existing = uniqueMessages.get(messageId);
      uniqueMessages.set(messageId, {
        ...existing,
        ...message,
        is_read: Boolean(existing?.is_read || message.is_read),
      });
    });

    this.messagesByChat[chatId] = Array.from(uniqueMessages.values()).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
  }

  mergeMessages(chatId, messages) {
    const merged = new Map();

    this.getMessages(chatId).forEach((message) =>
      merged.set(normalizeId(message.id), message),
    );
    messages.forEach((message) => {
      const messageId = normalizeId(message.id);
      const existing = merged.get(messageId);
      merged.set(messageId, {
        ...existing,
        ...message,
        is_read: Boolean(existing?.is_read || message.is_read),
      });
    });

    this.messagesByChat[chatId] = Array.from(merged.values()).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
  }

  getMessages(chatId) {
    return this.messagesByChat[chatId] || [];
  }

  sendMessage(chatId, message) {
    return this.sendWS({
      action: "send_message",
      chat_id: chatId,
      message,
    });
  }

  setLastMessage(chatId, message) {
    this.lastMessageByChat[chatId] = message;
  }

  getLastMessage(chatId) {
    return this.lastMessageByChat[chatId] || null;
  }

  setVoiceParticipants(chatId, participants = []) {
    if (!chatId) return;

    this.voiceParticipantsByChatId[chatId] = participants;
  }

  getVoiceParticipants(chatId) {
    return this.voiceParticipantsByChatId[chatId] || [];
  }

  clearVoiceParticipants(chatId) {
    if (!chatId) return;

    delete this.voiceParticipantsByChatId[chatId];
  }

  handleVoiceRoomState(data) {
    const { chat_id: chatId, participants = [] } = data;

    this.setVoiceParticipants(chatId, participants);
  }

  updateChat(chatId, changes) {
    const normalizedChatId = normalizeId(chatId);
    const chatIndex = this.chats.findIndex(
      (chat) => normalizeId(chat.id) === normalizedChatId,
    );
    const chat = this.chats[chatIndex];
    const chatChanged = chat
      && Object.entries(changes).some(([key, value]) => chat[key] !== value);

    if (chatChanged) {
      this.chats[chatIndex] = { ...chat, ...changes };
      this.dedupeChats();
    }

    const selectedChatChanged = normalizeId(this.selectedChat?.id) === normalizedChatId
      && Object.entries(changes).some(
        ([key, value]) => this.selectedChat.data[key] !== value,
      );

    if (selectedChatChanged) {
      this.selectedChat = {
        ...this.selectedChat,
        data: { ...this.selectedChat.data, ...changes },
      };
    }
  }

  setUnreadCount(chatId, unreadCount) {
    const normalizedChatId = normalizeId(chatId);
    const normalizedCount = Math.max(0, unreadCount);
    const chat = this.chats.find(
      (item) => normalizeId(item.id) === normalizedChatId,
    );

    if (
      (chat?.unread_count ?? 0) === normalizedCount
      && (
        normalizeId(this.selectedChat?.id) !== normalizedChatId
        || (this.selectedChat.data.unread_count ?? 0) === normalizedCount
      )
    ) {
      return;
    }

    this.updateChat(chatId, {
      unread_count: normalizedCount,
    });
  }

  incrementUnreadCount(chatId) {
    const chat = this.chats.find(
      (item) => normalizeId(item.id) === normalizeId(chatId),
    );
    if (!chat) return;

    this.setUnreadCount(chatId, (chat.unread_count || 0) + 1);
  }

  markChatRead(chatId, upToMessageId = null, force = false) {
    const chat = this.chats.find(
      (item) => normalizeId(item.id) === normalizeId(chatId),
    );
    const targetMessageId = upToMessageId
      || this.getLastMessage(chatId)?.id
      || this.getMessages(chatId).at(-1)?.id
      || null;
    const hasUnreadMessages = (chat?.unread_count || 0) > 0;

    if (!force && !hasUnreadMessages && upToMessageId == null) {
      return false;
    }
    if (
      targetMessageId != null
      && (this.lastReadRequestByChat[chatId] || 0) >= targetMessageId
    ) {
      this.setUnreadCount(chatId, 0);
      return false;
    }

    this.setUnreadCount(chatId, 0);

    const payload = {
      action: "read_messages",
      chat_id: chatId,
      up_to_message_id: targetMessageId,
    };

    if (this.sendWS(payload)) {
      if (targetMessageId != null) {
        this.lastReadRequestByChat[chatId] = targetMessageId;
      }
      this.pendingReadsByChat.delete(chatId);
      return true;
    }

    this.pendingReadsByChat.set(chatId, payload);
    return false;
  }

  flushPendingReads() {
    this.pendingReadsByChat.forEach((payload, chatId) => {
      if (this.sendWS(payload)) {
        if (payload.up_to_message_id != null) {
          this.lastReadRequestByChat[chatId] = payload.up_to_message_id;
        }
        this.pendingReadsByChat.delete(chatId);
      }
    });
  }

  handleIncomingMessage(chatId, message, unreadCount) {
    this.addMessage(chatId, message);
    this.setLastMessage(chatId, message);
    this.ensureChatLoaded(chatId, unreadCount);

    const isOwnMessage = message.author?.user?.id === this.currentUser?.id;
    if (isOwnMessage) {
      this.setUnreadCount(chatId, 0);
      return;
    }

    if (normalizeId(this.selectedChat?.id) === normalizeId(chatId)) {
      this.setUnreadCount(chatId, unreadCount ?? 1);
      this.markChatRead(chatId, message.id);
    } else {
      this.setUnreadCount(
        chatId,
        unreadCount ?? ((this.chats.find(
          (chat) => normalizeId(chat.id) === normalizeId(chatId),
        )?.unread_count || 0) + 1),
      );
    }
  }

  async ensureChatLoaded(chatId, unreadCount = null) {
    if (
      this.chats.some((chat) => normalizeId(chat.id) === normalizeId(chatId)) ||
      this.loadingChatIds.has(chatId)
    ) {
      return;
    }

    this.loadingChatIds.add(chatId);

    try {
      const response = await ChatService.getChat(chatId);
      const chat = response.data;

      if (chat) {
        runInAction(() => {
          this.upsertChat(chat, { unreadCount });
        });
      }
    } catch (error) {
      console.error("Failed to load new chat:", error);
    } finally {
      runInAction(() => {
        this.loadingChatIds.delete(chatId);
      });
    }
  }

  openChat(chat) {
    this.openChatRequestId += 1;
    const unreadCount = chat.unread_count || 0;

    runInAction(() => {
      this.selectedChat = {
        id: chat.id,
        data: { ...chat, unread_count: 0 },
      };
      this.upsertChat(chat, { unreadCount: 0 });
      this.setUnreadCount(chat.id, 0);
    });

    if (unreadCount > 0) {
      this.markChatRead(chat.id, null, true);
    }
  }

  async openPrivateChat(user) {
    const requestId = this.openChatRequestId + 1;
    this.openChatRequestId = requestId;
    const res = await ChatService.openPrivateChat(user.id);

    runInAction(() => {
      if (requestId !== this.openChatRequestId) return;

      this.selectedChat = {
        id: res.data.id,
        data: { ...res.data, unread_count: 0 },
      };
      this.upsertChat(res.data, { unreadCount: 0 });
    });
  }

  async joinAndOpenChat(chatId) {
    if (this.isOpening) return;

    const requestId = this.openChatRequestId + 1;
    this.openChatRequestId = requestId;
    this.isOpening = true;

    try {
      await ChatService.joinChat(chatId);
      const response = await ChatService.getChat(chatId);
      if (requestId !== this.openChatRequestId) return;

      this.openChat(response.data);
    } finally {
      runInAction(() => {
        this.isOpening = false;
      });
    }
  }

  removeChat(chatId) {
    runInAction(() => {
      this.chats = this.chats.filter(
        (c) => normalizeId(c.id) !== normalizeId(chatId),
      );
    });
  }

  reset() {
    this.selectedChat = null;
    this.isOpening = false;
    this.isConnected = false;
    this.chats = [];
    this.messagesByChat = {};
    this.lastMessageByChat = {};
    this.loadingChatIds.clear();
    this.pendingReadsByChat.clear();
    this.lastReadRequestByChat = {};
    this.presenceByUserId = {};
    this.voiceParticipantsByChatId = {};
    // this.disconnect();
  }

  handleMessagesRead(data) {
    const { chat_id, user_id, last_read_message_id } = data;

    if (user_id === this.currentUser?.id) {
      this.lastReadRequestByChat[chat_id] = Math.max(
        this.lastReadRequestByChat[chat_id] || 0,
        last_read_message_id || 0,
      );
      this.setUnreadCount(chat_id, 0);
    }

    const messages = this.messagesByChat[chat_id];
    if (!messages || last_read_message_id == null) return;

    if (user_id === this.currentUser?.id) return;

    this.messagesByChat[chat_id] = messages.map((msg) =>
      msg.id <= last_read_message_id
      && msg.author?.user?.id === this.currentUser?.id
        ? { ...msg, is_read: true }
        : msg,
    );
  }

  handlePresenceChanged(data) {
    const { user_id: userId, status, last_seen: lastSeen } = data;
    const presence = { status, last_online: lastSeen };

    this.presenceByUserId[userId] = presence;

    if (this.currentUser?.id === userId) {
      this.currentUser = { ...this.currentUser, ...presence };
    }

    this.chats = this.chats.map((chat) => {
      if (chat.other_user?.id !== userId) return chat;
      return {
        ...chat,
        other_user: { ...chat.other_user, ...presence },
      };
    });
    this.dedupeChats();

    if (this.selectedChat?.data?.other_user?.id === userId) {
      this.selectedChat = {
        ...this.selectedChat,
        data: {
          ...this.selectedChat.data,
          other_user: {
            ...this.selectedChat.data.other_user,
            ...presence,
          },
        },
      };
    }

    this.presenceListener?.(data);
  }

  getUserPresence(user) {
    if (!user) return user;
    const presence = this.presenceByUserId[user.id];
    return presence ? { ...user, ...presence } : user;
  }
}
