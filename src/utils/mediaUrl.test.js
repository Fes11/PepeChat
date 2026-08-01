import test from "node:test";
import assert from "node:assert/strict";
import { resolveMediaUrlFromBase } from "./mediaUrl.js";

const DEVELOPMENT_API_URL = "http://127.0.0.1:8000";
const PRODUCTION_API_URL = "https://pepechat.fun";

test("returns null for an absent media URL", () => {
  assert.equal(resolveMediaUrlFromBase(null, DEVELOPMENT_API_URL), null);
  assert.equal(resolveMediaUrlFromBase(undefined, DEVELOPMENT_API_URL), null);
  assert.equal(resolveMediaUrlFromBase("", DEVELOPMENT_API_URL), null);
  assert.equal(resolveMediaUrlFromBase("   ", DEVELOPMENT_API_URL), null);
});

test("resolves API-relative and storage-relative media paths", () => {
  assert.equal(
    resolveMediaUrlFromBase("/media/user_avatars/avatar.jpg", DEVELOPMENT_API_URL),
    "http://127.0.0.1:8000/media/user_avatars/avatar.jpg",
  );
  assert.equal(
    resolveMediaUrlFromBase("media/chat_avatars/avatar.png", DEVELOPMENT_API_URL),
    "http://127.0.0.1:8000/media/chat_avatars/avatar.png",
  );
  assert.equal(
    resolveMediaUrlFromBase("user_avatars/avatar.jpg", DEVELOPMENT_API_URL),
    "http://127.0.0.1:8000/media/user_avatars/avatar.jpg",
  );
  assert.equal(
    resolveMediaUrlFromBase("./chat_avatars/avatar.png", DEVELOPMENT_API_URL),
    "http://127.0.0.1:8000/media/chat_avatars/avatar.png",
  );
});

test("keeps external absolute URLs unchanged", () => {
  const externalUrl = "https://cdn.example.com/avatars/user.jpg";
  assert.equal(
    resolveMediaUrlFromBase(externalUrl, PRODUCTION_API_URL),
    externalUrl,
  );
});

test("replaces stale local API origins with the configured environment URL", () => {
  assert.equal(
    resolveMediaUrlFromBase(
      "http://localhost:8000/media/user_avatars/avatar.jpg?version=2#photo",
      PRODUCTION_API_URL,
    ),
    "https://pepechat.fun/media/user_avatars/avatar.jpg?version=2#photo",
  );
});

test("uses the configured protocol and does not duplicate its base path", () => {
  const apiUrl = "https://pepechat.fun/api";

  assert.equal(
    resolveMediaUrlFromBase(
      "http://pepechat.fun/api/media/user_avatars/avatar.jpg",
      apiUrl,
    ),
    "https://pepechat.fun/api/media/user_avatars/avatar.jpg",
  );
  assert.equal(
    resolveMediaUrlFromBase("/media/user_avatars/avatar.jpg", apiUrl),
    "https://pepechat.fun/api/media/user_avatars/avatar.jpg",
  );
  assert.equal(
    resolveMediaUrlFromBase(
      "https://pepechat.fun/api/media/user_avatars/avatar.jpg",
      apiUrl,
    ),
    "https://pepechat.fun/api/media/user_avatars/avatar.jpg",
  );
});

test("normalizes duplicate path separators and protocol-relative URLs", () => {
  assert.equal(
    resolveMediaUrlFromBase("/media//user_avatars/avatar.jpg", PRODUCTION_API_URL),
    "https://pepechat.fun/media/user_avatars/avatar.jpg",
  );
  assert.equal(
    resolveMediaUrlFromBase(
      "//pepechat.fun/media/user_avatars/avatar.jpg",
      PRODUCTION_API_URL,
    ),
    "https://pepechat.fun/media/user_avatars/avatar.jpg",
  );
});

test("preserves browser-native blob and data URLs", () => {
  const blobUrl = "blob:https://pepechat.fun/a2c627c0";
  const dataUrl = "data:image/png;base64,iVBORw0KGgo=";

  assert.equal(resolveMediaUrlFromBase(blobUrl, PRODUCTION_API_URL), blobUrl);
  assert.equal(resolveMediaUrlFromBase(dataUrl, PRODUCTION_API_URL), dataUrl);
});
