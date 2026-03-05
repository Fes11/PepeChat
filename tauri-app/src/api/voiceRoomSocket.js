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

    this.ws = new WebSocket(`ws://localhost:8000/ws/room/${this.chatId}/`);

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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
