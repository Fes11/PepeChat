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

  setCurrentUser(user) {
    this.currentUser = user;
  }

  constructor() {
    makeAutoObservable(this);
  }

  sendWS(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(data));
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
      }

      if (data.type === "messages_read") {
        this.handleMessagesRead(data);
      }
    };

    this.socket.onclose = () => {
      console.log("❌ WebSocket disconnected");
      this.isConnected = false;
      this.socket = null;
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };
  }

  disconnect() {
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
    if (!this.socket) return;

    this.socket.send(
      JSON.stringify({
        action: "send_message",
        chat_id: chatId,
        message,
      }),
    );
  }

  setLastMessage(chatId, message) {
    this.lastMessageByChat[chatId] = message;
  }

  getLastMessage(chatId) {
    return this.lastMessageByChat[chatId] || null;
  }

  openChat(data) {
    runInAction(() => {
      this.selectedChat = { data };
    });
  }

  async openPrivateChat(user) {
    const res = await ChatService.openPrivateChat(user.id);

    runInAction(() => {
      this.selectedChat = { data: res.data };
      // Добавляем временно пустой чат в список, если его там нет
      if (!this.chats.find((c) => c.id === res.data.id)) {
        this.chats.unshift(res.data);
      }
    });
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
  }

  handleMessagesRead(data) {
    const { chat_id, last_message_id } = data;
    const messages = this.messagesByChat[chat_id];
    if (!messages) return;

    runInAction(() => {
      messages.forEach((msg) => {
        if (
          msg.id <= last_message_id &&
          msg.author?.user?.id === this.currentUser.id
        ) {
          msg.is_read = true;
        }
      });
    });
  }
}
