import { makeAutoObservable } from "mobx";

export default class ChatStore {
  selectedChat = null;
  isOpening = false;
  socket = null;
  isConnected = false;
  chats = [];
  messagesByChat = {};
  lastMessageByChat = {};

  constructor() {
    makeAutoObservable(this);
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
      })
    );
  }

  setLastMessage(chatId, message) {
    this.lastMessageByChat[chatId] = message;
  }

  getLastMessage(chatId) {
    return this.lastMessageByChat[chatId] || null;
  }

  openChat(data) {
    this.selectedChat = {
      type: "chat",
      data,
    };
  }

  openPrivateChat(data) {
    this.selectedChat = {
      type: "private",
      data,
    };
  }
}
