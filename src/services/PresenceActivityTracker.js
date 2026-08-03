export const AWAY_TIMEOUT = 5 * 60 * 1000;
export const ACTIVE_HEARTBEAT_INTERVAL = 20_000;
export const AWAY_HEARTBEAT_INTERVAL = 60_000;

export const getPresenceHeartbeatInterval = (state) => (
  state === "away" ? AWAY_HEARTBEAT_INTERVAL : ACTIVE_HEARTBEAT_INTERVAL
);

const ACTIVITY_EVENTS = [
  "keydown",
  "pointerdown",
  "pointermove",
  "touchstart",
  "wheel",
];

export default class PresenceActivityTracker {
  constructor({
    onStateChange,
    awayTimeout = AWAY_TIMEOUT,
    now = () => Date.now(),
    setTimer = (callback, delay) => setTimeout(callback, delay),
    clearTimer = (timer) => clearTimeout(timer),
    windowTarget = globalThis.window,
    documentTarget = globalThis.document,
  }) {
    this.onStateChange = onStateChange;
    this.awayTimeout = awayTimeout;
    this.now = now;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.windowTarget = windowTarget;
    this.documentTarget = documentTarget;
  }

  state = "online";
  lastActivityAt = 0;
  idleTimer = null;
  started = false;
  activeHold = false;

  start() {
    if (this.started) return;

    this.started = true;
    this.state = "online";
    this.lastActivityAt = this.now();
    ACTIVITY_EVENTS.forEach((eventName) => {
      this.windowTarget?.addEventListener(
        eventName,
        this.recordActivity,
        { passive: true },
      );
    });
    this.windowTarget?.addEventListener("focus", this.recordActivity);
    this.documentTarget?.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    if (!this.activeHold) this.scheduleIdleCheck(this.awayTimeout);
  }

  stop() {
    if (!this.started) return;

    this.started = false;
    ACTIVITY_EVENTS.forEach((eventName) => {
      this.windowTarget?.removeEventListener(eventName, this.recordActivity);
    });
    this.windowTarget?.removeEventListener("focus", this.recordActivity);
    this.documentTarget?.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    if (this.idleTimer !== null) {
      this.clearTimer(this.idleTimer);
      this.idleTimer = null;
    }
    this.state = "online";
    this.activeHold = false;
  }

  recordActivity = () => {
    if (!this.started) return;

    this.lastActivityAt = this.now();
    if (this.state === "away") {
      this.state = "online";
      this.onStateChange("online");
    }
    if (!this.activeHold && this.idleTimer === null) {
      this.scheduleIdleCheck(this.awayTimeout);
    }
  };

  setActiveHold(isActive) {
    const nextValue = Boolean(isActive);
    if (nextValue === this.activeHold) return;

    this.activeHold = nextValue;
    this.lastActivityAt = this.now();
    if (this.idleTimer !== null) {
      this.clearTimer(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.activeHold) {
      if (this.started && this.state === "away") {
        this.state = "online";
        this.onStateChange("online");
      }
      return;
    }

    if (this.started) this.scheduleIdleCheck(this.awayTimeout);
  }

  handleVisibilityChange = () => {
    if (this.documentTarget?.visibilityState === "visible") {
      this.recordActivity();
    }
  };

  checkIdle = () => {
    this.idleTimer = null;
    if (!this.started) return;
    if (this.activeHold) return;

    const remaining = this.awayTimeout - (this.now() - this.lastActivityAt);
    if (remaining > 0) {
      this.scheduleIdleCheck(remaining);
      return;
    }

    if (this.state !== "away") {
      this.state = "away";
      this.onStateChange("away");
    }
  };

  scheduleIdleCheck(delay) {
    this.idleTimer = this.setTimer(this.checkIdle, Math.max(0, delay));
  }
}
