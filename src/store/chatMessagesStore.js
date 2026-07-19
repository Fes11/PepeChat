import { makeAutoObservable } from "mobx";

const normalizeId = (id) => String(id);
const sortByCreatedAt = (messages) => messages.sort(
  (a, b) => new Date(a.created_at) - new Date(b.created_at),
);

export default class ChatMessagesStore {
  messagesByChat = {};
  lastMessageByChat = {};
  pendingReadsByChat = new Map();
  lastReadRequestByChat = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  addMessage(chatId, message) {
    const messages = this.getMessages(chatId);
    const messageId = normalizeId(message.id);
    if (messages.some((item) => normalizeId(item.id) === messageId)) return;
    this.messagesByChat[chatId] = [...messages, message];
  }

  setMessages(chatId, messages) {
    this.messagesByChat[chatId] = this.merge([], messages);
  }

  mergeMessages(chatId, messages) {
    this.messagesByChat[chatId] = this.merge(this.getMessages(chatId), messages);
  }

  merge(currentMessages, newMessages) {
    const merged = new Map();
    [...currentMessages, ...newMessages].forEach((message) => {
      const id = normalizeId(message.id);
      const existing = merged.get(id);
      merged.set(id, {
        ...existing,
        ...message,
        is_read: Boolean(existing?.is_read || message.is_read),
      });
    });
    return sortByCreatedAt(Array.from(merged.values()));
  }

  getMessages(chatId) {
    return this.messagesByChat[chatId] || [];
  }

  setLastMessage(chatId, message) {
    this.lastMessageByChat[chatId] = message;
  }

  getLastMessage(chatId) {
    return this.lastMessageByChat[chatId] || null;
  }

  handleMessagesRead(data, currentUserId) {
    const { chat_id: chatId, user_id: userId, last_read_message_id: lastReadId } = data;

    if (userId === currentUserId) {
      this.lastReadRequestByChat[chatId] = Math.max(
        this.lastReadRequestByChat[chatId] || 0,
        lastReadId || 0,
      );
      return { ownRead: true };
    }

    const messages = this.messagesByChat[chatId];
    if (!messages || lastReadId == null) return { ownRead: false };

    this.messagesByChat[chatId] = messages.map((message) =>
      message.id <= lastReadId && message.author?.user?.id === currentUserId
        ? { ...message, is_read: true }
        : message,
    );
    return { ownRead: false };
  }

  reset() {
    this.messagesByChat = {};
    this.lastMessageByChat = {};
    this.pendingReadsByChat.clear();
    this.lastReadRequestByChat = {};
  }
}
