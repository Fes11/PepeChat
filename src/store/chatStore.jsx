import { makeAutoObservable, runInAction } from "mobx";
import ChatService from "../services/ChatService";

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

  setCurrentUser(user) {
    this.currentUser = user;
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

  setChats(chats) {
    const existingById = new Map(this.chats.map((chat) => [chat.id, chat]));
    const uniqueChats = new Map();

    chats.forEach((chat) => {
      const existing = existingById.get(chat.id);
      const mergedChat = {
        ...chat,
        unread_count:
          this.selectedChat?.id === chat.id
            ? 0
            : (existing?.unread_count ?? chat.unread_count ?? 0),
      };

      uniqueChats.set(chat.id, mergedChat);

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
  }

  connect(token) {
    if (this.socket || !token) return;

    this.socketToken = token;
    this.shouldReconnect = true;

    const wsUrl = `ws://localhost:8000/ws/?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected");
      this.isConnected = true;
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
    };

    this.socket.onclose = () => {
      console.log("❌ WebSocket disconnected");
      this.isConnected = false;
      this.socket = null;

      if (this.shouldReconnect && !this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect(this.socketToken);
        }, 1000);
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

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  addMessage(chatId, message) {
    if (!this.messagesByChat[chatId]) {
      this.messagesByChat[chatId] = [];
    }

    if (this.messagesByChat[chatId].some((item) => item.id === message.id)) {
      return;
    }

    this.messagesByChat[chatId].push(message);
  }

  setMessages(chatId, messages) {
    this.messagesByChat[chatId] = messages;
  }

  mergeMessages(chatId, messages) {
    const merged = new Map();

    this.getMessages(chatId).forEach((message) => merged.set(message.id, message));
    messages.forEach((message) => {
      const existing = merged.get(message.id);
      merged.set(message.id, {
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

  updateChat(chatId, changes) {
    const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);
    const chat = this.chats[chatIndex];
    const chatChanged = chat
      && Object.entries(changes).some(([key, value]) => chat[key] !== value);

    if (chatChanged) {
      this.chats[chatIndex] = { ...chat, ...changes };
    }

    const selectedChatChanged = this.selectedChat?.id === chatId
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
    const normalizedCount = Math.max(0, unreadCount);
    const chat = this.chats.find((item) => item.id === chatId);

    if (
      (chat?.unread_count ?? 0) === normalizedCount
      && (
        this.selectedChat?.id !== chatId
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
    const chat = this.chats.find((item) => item.id === chatId);
    if (!chat) return;

    this.setUnreadCount(chatId, (chat.unread_count || 0) + 1);
  }

  markChatRead(chatId, upToMessageId = null, force = false) {
    const chat = this.chats.find((item) => item.id === chatId);
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

    if (this.selectedChat?.id === chatId) {
      this.setUnreadCount(chatId, unreadCount ?? 1);
      this.markChatRead(chatId, message.id);
    } else {
      this.setUnreadCount(
        chatId,
        unreadCount ?? ((this.chats.find((chat) => chat.id === chatId)?.unread_count || 0) + 1),
      );
    }
  }

  async ensureChatLoaded(chatId, unreadCount = null) {
    if (
      this.chats.some((chat) => chat.id === chatId) ||
      this.loadingChatIds.has(chatId)
    ) {
      return;
    }

    this.loadingChatIds.add(chatId);

    try {
      const response = await ChatService.getChat(chatId);
      const chat = response.data;

      if (chat && !this.chats.some((item) => item.id === chat.id)) {
        runInAction(() => {
          this.chats.unshift({
            ...chat,
            unread_count: this.selectedChat?.id === chat.id
              ? 0
              : (unreadCount ?? chat.unread_count),
          });
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
    const unreadCount = chat.unread_count || 0;

    runInAction(() => {
      this.selectedChat = {
        id: chat.id,
        data: { ...chat, unread_count: 0 },
      };
      this.setUnreadCount(chat.id, 0);
    });

    if (!this.chats.find((c) => c.id === chat.id)) {
      this.chats.unshift({ ...chat, unread_count: 0 });
    }

    if (unreadCount > 0) {
      this.markChatRead(chat.id, null, true);
    }
  }

  async openPrivateChat(user) {
    const res = await ChatService.openPrivateChat(user.id);

    runInAction(() => {
      this.selectedChat = {
        id: res.data.id,
        data: { ...res.data, unread_count: 0 },
      };
      // Добавляем временно пустой чат в список, если его там нет
      if (!this.chats.find((c) => c.id === res.data.id)) {
        this.chats.unshift({ ...res.data, unread_count: 0 });
      }
    });
  }

  async joinAndOpenChat(chatId) {
    if (this.isOpening) return;

    this.isOpening = true;

    try {
      await ChatService.joinChat(chatId);
      const response = await ChatService.getChat(chatId);
      this.openChat(response.data);
    } finally {
      runInAction(() => {
        this.isOpening = false;
      });
    }
  }

  removeChat(chatId) {
    runInAction(() => {
      this.chats = this.chats.filter((c) => c.id !== chatId);
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
}
