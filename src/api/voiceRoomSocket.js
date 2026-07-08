import { WS_BASE_URL } from "../config/env";

export class VoiceRoomSocket {
  constructor(chatId, { onMessage, onOpen, onClose, onError }) {
    this.chatId = chatId;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;

    this.ws = null;
    this.closeOnOpen = false;
  }

  connect() {
    if (this.ws) return;

    const token = localStorage.getItem("token");
    if (!token) {
      this.onError?.(new Error("Access token is missing"));
      return;
    }

    this.ws = new WebSocket(
      `${WS_BASE_URL}/ws/room/${this.chatId}/`,
      ["access-token", token],
    );

    this.ws.onopen = () => {
      if (this.closeOnOpen) {
        this.ws.close();
        return;
      }

      this.onOpen?.();
    };

    this.ws.onclose = (event) => {
      this.onClose?.(event);
      this.ws = null;
      this.closeOnOpen = false;
    };

    this.ws.onerror = (error) => {
      this.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage?.(data);
    };
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  disconnect() {
    if (!this.ws) return;

    if (this.ws.readyState === WebSocket.CONNECTING) {
      this.closeOnOpen = true;
      return;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}
