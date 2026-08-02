import { WS_BASE_URL } from "../config/env.js";

const DEFAULT_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

export class VoiceRoomSocket {
  constructor(
    chatId,
    {
      onMessage,
      onOpen,
      onClose,
      onError,
      onReconnecting,
      refreshToken,
      onAuthFailure,
      reconnectDelay = DEFAULT_RECONNECT_DELAY,
    },
  ) {
    this.chatId = chatId;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this.onReconnecting = onReconnecting;
    this.refreshToken = refreshToken;
    this.onAuthFailure = onAuthFailure;
    this.reconnectDelay = reconnectDelay;

    this.ws = null;
    this.closeOnOpen = false;
    this.shouldReconnect = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
  }

  connect() {
    this.shouldReconnect = true;
    this.openSocket();
  }

  openSocket() {
    if (this.ws || this.reconnectTimer) return;

    const token = localStorage.getItem("token");
    if (!token) {
      this.onError?.(new Error("Access token is missing"));
      return;
    }

    const socket = new WebSocket(
      `${WS_BASE_URL}/ws/room/${this.chatId}/`,
      ["access-token", token],
    );
    this.ws = socket;

    socket.onopen = () => {
      if (socket !== this.ws) return;
      if (this.closeOnOpen || !this.shouldReconnect) {
        socket.close();
        return;
      }

      this.reconnectAttempts = 0;
      this.onOpen?.();
    };

    socket.onclose = (event) => {
      if (socket !== this.ws) return;

      // Clear the closed instance before callbacks. A reconnect initiated by a
      // callback must not be blocked by the stale socket reference.
      this.ws = null;
      this.closeOnOpen = false;
      this.onClose?.(event);

      if (this.shouldReconnect) void this.scheduleReconnect(event.code);
    };

    socket.onerror = (error) => {
      if (socket !== this.ws) return;
      this.onError?.(error);
    };

    socket.onmessage = (event) => {
      if (socket !== this.ws) return;
      try {
        this.onMessage?.(JSON.parse(event.data));
      } catch (error) {
        this.onError?.(error);
      }
    };
  }

  async scheduleReconnect(closeCode) {
    if (this.reconnectTimer || !this.shouldReconnect) return;
    if (closeCode === 4403) {
      this.shouldReconnect = false;
      return;
    }

    if (closeCode === 4401) {
      try {
        if (!this.refreshToken) throw new Error("Token refresh is unavailable");
        await this.refreshToken();
      } catch (error) {
        if (!this.shouldReconnect) return;
        this.shouldReconnect = false;
        this.onError?.(error);
        this.onAuthFailure?.();
        return;
      }
    }

    if (!this.shouldReconnect) return;
    const delay = Math.min(
      this.reconnectDelay * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempts += 1;
    this.onReconnecting?.({ closeCode, delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const socket = this.ws;
    if (!socket) return;

    if (socket.readyState === WebSocket.CONNECTING) {
      this.closeOnOpen = true;
      return;
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }
}
