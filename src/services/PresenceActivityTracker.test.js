import assert from "node:assert/strict";
import test from "node:test";

import PresenceActivityTracker, {
  ACTIVE_HEARTBEAT_INTERVAL,
  AWAY_HEARTBEAT_INTERVAL,
  getPresenceHeartbeatInterval,
} from "./PresenceActivityTracker.js";

class FakeEventTarget {
  listeners = new Map();
  visibilityState = "visible";

  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) ?? new Set();
    listeners.add(listener);
    this.listeners.set(name, listeners);
  }

  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }

  dispatch(name) {
    this.listeners.get(name)?.forEach((listener) => listener());
  }

  listenerCount(name) {
    return this.listeners.get(name)?.size ?? 0;
  }
}

const createHarness = () => {
  let now = 0;
  let nextTimerId = 1;
  const timers = new Map();
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeEventTarget();
  const states = [];
  const tracker = new PresenceActivityTracker({
    onStateChange: (state) => states.push(state),
    now: () => now,
    setTimer: (callback, delay) => {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, { callback, dueAt: now + delay });
      return timerId;
    },
    clearTimer: (timerId) => timers.delete(timerId),
    windowTarget,
    documentTarget,
  });

  return {
    documentTarget,
    states,
    timers,
    tracker,
    windowTarget,
    advanceBy(milliseconds) {
      const targetTime = now + milliseconds;
      while (true) {
        const nextTimer = [...timers.entries()]
          .sort((left, right) => left[1].dueAt - right[1].dueAt)[0];
        if (!nextTimer || nextTimer[1].dueAt > targetTime) break;

        const [timerId, timer] = nextTimer;
        now = timer.dueAt;
        timers.delete(timerId);
        timer.callback();
      }
      now = targetTime;
    },
  };
};

test("switches to away after five minutes and resumes on activity", () => {
  const harness = createHarness();
  harness.tracker.start();

  harness.advanceBy(5 * 60 * 1000);
  assert.deepEqual(harness.states, ["away"]);

  harness.windowTarget.dispatch("keydown");
  assert.deepEqual(harness.states, ["away", "online"]);
  assert.equal(harness.timers.size, 1);

  harness.tracker.stop();
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.windowTarget.listenerCount("keydown"), 0);
});

test("activity postpones away without creating a timer per event", () => {
  const harness = createHarness();
  harness.tracker.start();

  harness.advanceBy(4 * 60 * 1000);
  harness.windowTarget.dispatch("pointermove");
  harness.windowTarget.dispatch("pointermove");
  assert.equal(harness.timers.size, 1);

  harness.advanceBy(60 * 1000);
  assert.deepEqual(harness.states, []);
  assert.equal(harness.timers.size, 1);

  harness.advanceBy(4 * 60 * 1000);
  assert.deepEqual(harness.states, ["away"]);
});

test("only returning to a visible window counts as activity", () => {
  const harness = createHarness();
  harness.tracker.start();
  harness.advanceBy(5 * 60 * 1000);

  harness.documentTarget.visibilityState = "hidden";
  harness.documentTarget.dispatch("visibilitychange");
  assert.deepEqual(harness.states, ["away"]);

  harness.documentTarget.visibilityState = "visible";
  harness.documentTarget.dispatch("visibilitychange");
  assert.deepEqual(harness.states, ["away", "online"]);
});

test("voice room holds presence online until the user leaves", () => {
  const harness = createHarness();
  harness.tracker.start();
  harness.advanceBy(5 * 60 * 1000);
  assert.deepEqual(harness.states, ["away"]);

  harness.tracker.setActiveHold(true);
  assert.deepEqual(harness.states, ["away", "online"]);
  assert.equal(harness.timers.size, 0);

  harness.advanceBy(30 * 60 * 1000);
  assert.deepEqual(harness.states, ["away", "online"]);

  harness.tracker.setActiveHold(false);
  assert.equal(harness.timers.size, 1);
  harness.advanceBy(5 * 60 * 1000);
  assert.deepEqual(harness.states, ["away", "online", "away"]);
});

test("uses a slower heartbeat while away", () => {
  assert.equal(getPresenceHeartbeatInterval("online"), ACTIVE_HEARTBEAT_INTERVAL);
  assert.equal(getPresenceHeartbeatInterval("away"), AWAY_HEARTBEAT_INTERVAL);
  assert.equal(ACTIVE_HEARTBEAT_INTERVAL, 20_000);
  assert.equal(AWAY_HEARTBEAT_INTERVAL, 60_000);
});
