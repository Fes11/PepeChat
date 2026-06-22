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
    this.chats = chats;

    chats.forEach((chat) => {
      if (chat.last_message) {
        this.lastMessageByChat[chat.id] = chat.last_message;
      }
    });
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
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 WS message:", data);

      if (data.type === "message") {
        this.addMessage(data.chat_id, data.payload);
        this.setLastMessage(data.chat_id, data.payload);
        this.ensureChatLoaded(data.chat_id);
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
    this.messagesByChat[chatId].push(message);
  }

  setMessages(chatId, messages) {
    this.messagesByChat[chatId] = messages;
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

  async ensureChatLoaded(chatId) {
    if (
      this.chats.some((chat) => chat.id === chatId) ||
      this.loadingChatIds.has(chatId)
    ) {
      return;
    }

    this.loadingChatIds.add(chatId);

    try {
      const response = await ChatService.getChats(1);
      const chat = response.data.results.find((item) => item.id === chatId);

      if (chat && !this.chats.some((item) => item.id === chat.id)) {
        runInAction(() => {
          this.chats.unshift(chat);
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
    runInAction(() => {
      this.selectedChat = {
        id: chat.id,
        data: chat,
      };
    });

    if (!this.chats.find((c) => c.id === chat.id)) {
      this.chats.unshift(chat);
    }
  }

  async openPrivateChat(user) {
    const res = await ChatService.openPrivateChat(user.id);

    runInAction(() => {
      this.selectedChat = {
        id: res.data.id,
        data: res.data,
      };
      // Добавляем временно пустой чат в список, если его там нет
      if (!this.chats.find((c) => c.id === res.data.id)) {
        this.chats.unshift(res.data);
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
    // this.disconnect();
  }

  handleMessagesRead(data) {
    const { chat_id, user_id } = data;

    const messages = this.messagesByChat[chat_id];
    if (!messages) return;

    runInAction(() => {
      messages.forEach((msg) => {
        if (msg.author?.user?.id === this.currentUser.id) {
          msg.is_read = true;
        }
      });
    });
  }
}
