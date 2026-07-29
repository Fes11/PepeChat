import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialUpdateState,
  formatBytes,
  formatEta,
  formatSpeed,
  updateReducer,
} from "./updateState.js";

const reduce = (state, ...actions) =>
  actions.reduce((current, action) => updateReducer(current, action), state);

test("startup check gates the app until it is up to date", () => {
  const checking = updateReducer(createInitialUpdateState(), {
    type: "START_CHECK",
    source: "startup",
    showScreen: true,
  });

  assert.equal(checking.status, "checking");
  assert.equal(checking.startupComplete, false);
  assert.equal(checking.isUpdateScreenVisible, true);

  const complete = updateReducer(checking, {
    type: "UP_TO_DATE",
    currentVersion: "1.2.3",
  });

  assert.equal(complete.status, "upToDate");
  assert.equal(complete.currentVersion, "1.2.3");
  assert.equal(complete.startupComplete, true);
  assert.equal(complete.isUpdateScreenVisible, false);
});

test("known download size calculates progress, speed and ETA", () => {
  const state = reduce(
    createInitialUpdateState(),
    { type: "START_DOWNLOAD", source: "startup" },
    { type: "DOWNLOAD_STARTED", total: 1_000 },
    { type: "DOWNLOAD_PROGRESS", chunkLength: 200, now: 1_000 },
    { type: "DOWNLOAD_PROGRESS", chunkLength: 300, now: 2_000 },
  );

  assert.equal(state.downloaded, 500);
  assert.equal(state.percent, 50);
  assert.equal(state.bytesPerSecond, 300);
  assert.equal(state.etaSeconds, 2);

  const installing = updateReducer(state, { type: "DOWNLOAD_FINISHED" });
  assert.equal(installing.status, "installing");
  assert.equal(installing.downloaded, 1_000);
  assert.equal(installing.percent, 100);
  assert.equal(installing.etaSeconds, 0);
});

test("unknown download size does not invent percent or ETA", () => {
  const state = reduce(
    createInitialUpdateState(),
    { type: "START_DOWNLOAD", source: "manual" },
    { type: "DOWNLOAD_STARTED", total: 0 },
    { type: "DOWNLOAD_PROGRESS", chunkLength: 256, now: 1_000 },
    { type: "DOWNLOAD_PROGRESS", chunkLength: 256, now: 2_000 },
  );

  assert.equal(state.downloaded, 512);
  assert.equal(state.total, 0);
  assert.equal(state.percent, null);
  assert.equal(state.etaSeconds, null);
});

test("a new check clears stale update metrics and errors", () => {
  const failed = reduce(
    createInitialUpdateState(),
    { type: "START_DOWNLOAD", source: "manual" },
    { type: "DOWNLOAD_STARTED", total: 1_000 },
    { type: "DOWNLOAD_PROGRESS", chunkLength: 400, now: 1_000 },
    { type: "ERROR", phase: "install", error: "failure" },
  );
  const checking = updateReducer(failed, {
    type: "START_CHECK",
    source: "manual",
    showScreen: false,
  });

  assert.equal(checking.status, "checking");
  assert.equal(checking.downloaded, 0);
  assert.equal(checking.total, 0);
  assert.equal(checking.error, "");
  assert.equal(checking.errorPhase, "");
});

test("continuing after a startup error releases only the startup gate", () => {
  const startupError = reduce(
    createInitialUpdateState(),
    { type: "START_CHECK", source: "startup", showScreen: true },
    { type: "ERROR", phase: "check", error: "offline" },
  );
  const continued = updateReducer(startupError, { type: "CONTINUE" });

  assert.equal(continued.startupComplete, true);
  assert.equal(continued.isUpdateScreenVisible, false);

  const manualError = reduce(
    continued,
    { type: "START_CHECK", source: "manual", showScreen: false },
    { type: "ERROR", phase: "check", error: "offline" },
    { type: "CONTINUE" },
  );
  assert.equal(manualError.startupComplete, true);
});

test("progress formatters produce compact Russian labels", () => {
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 МБ");
  assert.equal(formatSpeed(2 * 1024 * 1024), "2.0 МБ/с");
  assert.equal(formatEta(75), "2 мин.");
  assert.equal(formatEta(null), "—");
});
