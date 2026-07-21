import { invoke } from "@tauri-apps/api/core";

const CACHE_VERSION = 1;
const DB_NAME = "pepechat-cache";
const STORE_NAME = "snapshots";
const ACTIVE_ACCOUNT_KEY = "pepechat.activeAccount";

const isTauri = () => Boolean(window.__TAURI_INTERNALS__);
const cacheKey = (accountId) => `account-${String(accountId)}`;

const openDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const idbRead = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
};

const idbWrite = async (key, value) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
};

export default class LocalCacheService {
  static getActiveAccountId() {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  }

  static setActiveAccountId(accountId) {
    if (accountId == null) localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    else localStorage.setItem(ACTIVE_ACCOUNT_KEY, String(accountId));
  }

  static async read(accountId) {
    if (accountId == null) return null;
    try {
      const raw = isTauri()
        ? await invoke("read_account_cache", { accountId: String(accountId) })
        : await idbRead(cacheKey(accountId));
      const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (snapshot?.version !== CACHE_VERSION
        || String(snapshot.accountId) !== String(accountId)) return null;
      return snapshot;
    } catch (error) {
      console.warn("Failed to read local cache", error);
      return null;
    }
  }

  static async write(accountId, data) {
    if (accountId == null) return;
    const snapshot = {
      ...data,
      version: CACHE_VERSION,
      accountId: String(accountId),
      updatedAt: new Date().toISOString(),
    };
    try {
      // MobX stores expose observable Proxy objects which IndexedDB cannot
      // structured-clone. JSON is also the canonical Tauri representation, so
      // serialize once at the persistence boundary for identical behaviour.
      const serialized = JSON.stringify(snapshot);
      if (isTauri()) {
        await invoke("write_account_cache", {
          accountId: String(accountId),
          contents: serialized,
        });
      } else {
        await idbWrite(cacheKey(accountId), serialized);
      }
    } catch (error) {
      console.warn("Failed to persist local cache", error);
    }
  }
}
