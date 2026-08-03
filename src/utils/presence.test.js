import assert from "node:assert/strict";
import test from "node:test";

import { getPresencePatch } from "./presence.js";

test("online and away transitions preserve the existing last-online value", () => {
  const user = { status: "offline", last_online: "2026-08-03T10:00:00Z" };

  assert.deepEqual(
    { ...user, ...getPresencePatch({ status: "away", last_seen: null }) },
    { status: "away", last_online: "2026-08-03T10:00:00Z" },
  );
});

test("offline transition applies the server last-seen value", () => {
  assert.deepEqual(
    getPresencePatch({
      status: "offline",
      last_seen: "2026-08-03T11:00:00Z",
    }),
    { status: "offline", last_online: "2026-08-03T11:00:00Z" },
  );
});
