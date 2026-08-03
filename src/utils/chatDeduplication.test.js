import assert from "node:assert/strict";
import test from "node:test";

import {
  deduplicateChats,
  getChatIdentityKey,
} from "./chatDeduplication.js";

test("private chats are identified by the other user instead of chat id", () => {
  assert.equal(
    getChatIdentityKey({ id: 10, is_group: false, other_user: { id: 7 } }),
    "private:7",
  );
  assert.equal(
    getChatIdentityKey({ id: 11, is_group: false, other_user: { id: "7" } }),
    "private:7",
  );
});

test("duplicate private chats collapse to the most recently active chat", () => {
  const chats = deduplicateChats([
    {
      id: 10,
      is_group: false,
      other_user: { id: 7 },
      created_at: "2026-07-01T10:00:00Z",
      last_message: { created_at: "2026-07-03T10:00:00Z" },
      unread_count: 0,
    },
    {
      id: 11,
      is_group: false,
      other_user: { id: "7" },
      created_at: "2026-07-02T10:00:00Z",
      last_message: null,
      unread_count: 2,
    },
  ]);

  assert.equal(chats.length, 1);
  assert.equal(chats[0].id, 10);
  assert.equal(chats[0].unread_count, 2);
});

test("group chats with the same name remain separate", () => {
  const chats = deduplicateChats([
    { id: 20, is_group: true, name: "Team" },
    { id: 21, is_group: true, name: "Team" },
  ]);

  assert.deepEqual(chats.map((chat) => chat.id), [20, 21]);
});
