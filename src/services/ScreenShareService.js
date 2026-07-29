import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export const isDesktopApp = () => Boolean(window.__TAURI_INTERNALS__);

export const screenShareService = {
  listSources: () => invoke("list_capture_sources"),
  getThumbnail: (sourceId) =>
    invoke("get_capture_thumbnail", { sourceId }),
  start: (request) => invoke("start_screen_share", { request }),
  stop: () => invoke("stop_screen_share"),
  getState: () => invoke("get_screen_share_state"),
  onStopped: (handler) => listen("screen-share-stopped", handler),
  onError: (handler) => listen("screen-share-error", handler),
};
