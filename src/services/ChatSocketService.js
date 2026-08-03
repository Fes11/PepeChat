import { refreshAccessToken, redirectToLogin } from "../api";
import { WS_BASE_URL } from "../config/env";
import PresenceActivityTracker, {
  getPresenceHeartbeatInterval,
} from "./PresenceActivityTracker";
const RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;

export default class ChatSocketService {
  constructor({ onConnectionChange, onMessage, onOpen, activityTracker }) {
    this.onConnectionChange = onConnectionChange;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.activityTracker = activityTracker ?? new PresenceActivityTracker({
      onStateChange: this.setPresenceState,
    });
  }

  socket = null;
  token = null;
  reconnectTimer = null;
  heartbeatTimer = null;
  shouldReconnect = false;
  reconnectAttempts = 0;
  presenceState = "online";

  connect(token) {
    if (!token) return;

    this.token = token;
    this.shouldReconnect = true;
    this.activityTracker.start();

    if (this.socket) return;

    const socket = new WebSocket(`${WS_BASE_URL}/ws/`, ["access-token", token]);
    this.socket = socket;

    socket.onopen = () => {
      if (socket !== this.socket) return;
      this.onConnectionChange(true);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.sendPresenceHeartbeat();
      this.onOpen?.();
    };

    socket.onmessage = (event) => {
      if (socket !== this.socket) return;

      try {
        this.onMessage(JSON.parse(event.data));
      } catch (error) {
        console.error("Failed to process WebSocket message", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    socket.onclose = (event) => {
      if (socket !== this.socket) return;

      this.clearSocket(socket);
      this.onConnectionChange(false);
      this.stopHeartbeat();

      if (this.shouldReconnect) this.scheduleReconnect(event.code);
    };
  }

  send(data) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;

    this.socket.send(JSON.stringify(data));
    return true;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.token = null;
    this.presenceState = "online";
    this.activityTracker.stop();
    this.clearReconnectTimer();
    this.stopHeartbeat();

    const socket = this.socket;
    this.socket = null;
    this.clearSocket(socket);
    socket?.close();
    this.onConnectionChange(false);
  }

  async scheduleReconnect(closeCode) {
    if (this.reconnectTimer || !this.shouldReconnect) return;

    if (closeCode === 4401) {
      try {
        const token = await refreshAccessToken();
        if (!this.shouldReconnect) return;
        this.token = token;
      } catch (error) {
        if (!this.shouldReconnect) return;
        this.shouldReconnect = false;
        redirectToLogin();
        return;
      }
    }

    if (!this.shouldReconnect || !this.token) return;

    const delay = Math.min(
      RECONNECT_DELAY * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.token);
    }, delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    const interval = getPresenceHeartbeatInterval(this.presenceState);
    this.heartbeatTimer = setInterval(
      () => this.sendPresenceHeartbeat(),
      interval,
    );
  }

  stopHeartbeat() {
    if (this.heartbeatTimer === null) return;
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  clearReconnectTimer() {
    if (this.reconnectTimer === null) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  sendPresenceHeartbeat() {
    return this.send({
      action: "presence.heartbeat",
      state: this.presenceState,
    });
  }

  setVoiceRoomActive(isActive) {
    this.activityTracker.setActiveHold(Boolean(isActive));
  }

  setPresenceState = (state) => {
    if (state === this.presenceState || !["online", "away"].includes(state)) {
      return;
    }

    this.presenceState = state;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.startHeartbeat();
      this.sendPresenceHeartbeat();
    }
  };

  clearSocket(socket) {
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (this.socket === socket) this.socket = null;
  }
}
