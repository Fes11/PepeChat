import { makeAutoObservable } from "mobx";

const normalizeId = (id) => String(id);
const sortByCreatedAt = (messages) => messages.sort(
  (a, b) => new Date(a.created_at) - new Date(b.created_at),
);
const MAX_CACHED_MESSAGES_PER_CHAT = 300;
const OPTIMISTIC_MATCH_WINDOW_MS = 2 * 60 * 1000;

const isTemporaryMessage = (message) =>
  message.delivery_status === "pending"
  || message.delivery_status === "failed"
  || normalizeId(message.id).startsWith("temp:");

const sameMessageContent = (left, right) =>
  left.text === right.text
  && (left.sticker ?? null) === (right.sticker ?? null)
  && normalizeId(left.author?.user?.id) === normalizeId(right.author?.user?.id);

export default class ChatMessagesStore {
  messagesByChat = {};
  lastMessageByChat = {};
  pendingReadsByChat = new Map();
  lastReadRequestByChat = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  addMessage(chatId, message) {
    this.messagesByChat[chatId] = this.merge(this.getMessages(chatId), [message]);
  }

  setMessages(chatId, messages) {
    const localOnly = this.getMessages(chatId).filter((message) =>
      message.delivery_status === "pending" || message.delivery_status === "failed");
    this.messagesByChat[chatId] = this.merge(localOnly, messages);
  }

  mergeMessages(chatId, messages) {
    this.messagesByChat[chatId] = this.merge(this.getMessages(chatId), messages);
  }

  merge(currentMessages, newMessages) {
    const merged = [];
    [...currentMessages, ...newMessages].forEach((rawMessage) => {
      let message = rawMessage;

      // Compatibility with servers that do not echo client_id yet. A server
      // message can safely replace only a close, content-identical optimistic
      // message from the same author.
      if (message.id != null
        && !normalizeId(message.id).startsWith("temp:")
        && !message.client_id) {
        const serverTime = new Date(message.created_at).getTime();
        const optimistic = merged
          .filter((item) => isTemporaryMessage(item) && sameMessageContent(item, message))
          .map((item) => ({
            item,
            distance: Math.abs(new Date(item.created_at).getTime() - serverTime),
          }))
          .filter(({ distance }) => Number.isFinite(distance) && distance <= OPTIMISTIC_MATCH_WINDOW_MS)
          .sort((left, right) => left.distance - right.distance)[0]?.item;

        if (optimistic?.client_id) {
          message = { ...message, client_id: optimistic.client_id };
        }
      }

      const index = merged.findIndex((item) =>
        (message.id != null && item.id != null && normalizeId(item.id) === normalizeId(message.id))
        || (message.client_id && item.client_id === message.client_id));
      const existing = index >= 0 ? merged[index] : null;
      const next = {
        ...existing,
        ...message,
        delivery_status: message.id != null && !normalizeId(message.id).startsWith("temp:")
          ? "sent"
          : (message.delivery_status ?? existing?.delivery_status),
        is_read: Boolean(existing?.is_read || message.is_read),
      };
      if (index >= 0) merged[index] = next;
      else merged.push(next);
    });
    return sortByCreatedAt(merged);
  }

  setDeliveryStatus(chatId, clientId, deliveryStatus) {
    const messages = this.getMessages(chatId);
    const index = messages.findIndex((message) => message.client_id === clientId);
    if (index < 0 || messages[index].delivery_status === deliveryStatus) return;
    const next = messages.slice();
    next[index] = { ...next[index], delivery_status: deliveryStatus };
    this.messagesByChat[chatId] = next;
  }

  getMessages(chatId) {
    return this.messagesByChat[chatId] || [];
  }

  removeMessage(chatId, messageId) {
    const id = normalizeId(messageId);
    this.messagesByChat[chatId] = this.getMessages(chatId).filter(
      (message) => normalizeId(message.id) !== id,
    );
    this.lastMessageByChat[chatId] = this.messagesByChat[chatId].at(-1) || null;
  }

  setLastMessage(chatId, message) {
    this.lastMessageByChat[chatId] = message;
  }

  getLastMessage(chatId) {
    return this.lastMessageByChat[chatId] || null;
  }

  hydrate(snapshot = {}) {
    this.messagesByChat = Object.fromEntries(
      Object.entries(snapshot.messagesByChat || {}).map(([chatId, messages]) => [
        chatId,
        messages.map((message) => message.delivery_status === "pending"
          ? { ...message, delivery_status: "failed" }
          : message),
      ]),
    );
    this.lastMessageByChat = snapshot.lastMessageByChat || {};
  }

  toJSON() {
    const messagesByChat = Object.fromEntries(
      Object.entries(this.messagesByChat).map(([chatId, messages]) => [
        chatId,
        messages.slice(-MAX_CACHED_MESSAGES_PER_CHAT),
      ]),
    );
    return {
      messagesByChat,
      lastMessageByChat: this.lastMessageByChat,
    };
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
