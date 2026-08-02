import test from "node:test";
import assert from "node:assert/strict";

import { VoiceRoomSocket } from "./voiceRoomSocket.js";

const waitForTimers = () => new Promise((resolve) => setTimeout(resolve, 5));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances = [];

  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = MockWebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  closeWith(code) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code });
  }

  close() {
    this.closeWith(1000);
  }

  send() {}
}

test.beforeEach(() => {
  MockWebSocket.instances = [];
  globalThis.WebSocket = MockWebSocket;
  globalThis.localStorage = {
    getItem: (key) => (key === "token" ? "access-token" : null),
  };
});

test("refreshes an expired JWT and reconnects the presence socket", async () => {
  let refreshCount = 0;
  const socket = new VoiceRoomSocket("7", {
    refreshToken: async () => {
      refreshCount += 1;
    },
    reconnectDelay: 0,
  });

  socket.connect();
  MockWebSocket.instances[0].open();
  MockWebSocket.instances[0].closeWith(4401);
  await waitForTimers();

  assert.equal(refreshCount, 1);
  assert.equal(MockWebSocket.instances.length, 2);
});

test("manual disconnect never schedules a reconnect", async () => {
  const socket = new VoiceRoomSocket("7", { reconnectDelay: 0 });

  socket.connect();
  MockWebSocket.instances[0].open();
  socket.disconnect();
  await waitForTimers();

  assert.equal(MockWebSocket.instances.length, 1);
});

