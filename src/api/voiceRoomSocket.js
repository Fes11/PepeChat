export class VoiceRoomSocket {
  constructor(chatId, { onMessage, onOpen, onClose, onError }) {
    this.chatId = chatId;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;

    this.ws = null;
  }

  connect() {
    if (this.ws) return;

    const token = localStorage.getItem("token");
    if (!token) {
      this.onError?.(new Error("Access token is missing"));
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.VITE_WS_HOST || "localhost:8000";
    this.ws = new WebSocket(
      `${protocol}//${wsHost}/ws/room/${this.chatId}/`,
      ["access-token", token],
    );

    this.ws.onopen = () => {
      this.onOpen?.();
    };

    this.ws.onclose = (event) => {
      this.onClose?.(event);
      this.ws = null;
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
    }
  }

  disconnect() {
    if (!this.ws) return;

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    this.ws = null;
  }
}
