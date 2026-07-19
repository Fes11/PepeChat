import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const UpdateContext = createContext(null);
const isTauri = () => Boolean(window.__TAURI_INTERNALS__);

const initialState = {
  status: "idle",
  currentVersion: "",
  nextVersion: "",
  notes: "",
  downloaded: 0,
  total: 0,
  error: "",
};

const errorMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (/timed?\s*out|network|connect|dns|offline|fetch/i.test(message)) {
    return "Не удалось подключиться к серверу обновлений. Проверьте интернет и повторите попытку.";
  }
  return message || "Не удалось выполнить обновление.";
};

export function UpdateProvider({ children }) {
  const [state, setState] = useState(initialState);
  const updateRef = useRef(null);
  const checkingRef = useRef(false);
  const startupCheckRef = useRef(false);

  const checkForUpdates = useCallback(async ({ silent = false } = {}) => {
    if (!isTauri() || checkingRef.current) return null;
    checkingRef.current = true;
    setState((value) => ({ ...value, status: "checking", error: "" }));

    try {
      const currentVersion = await getVersion();
      const update = await check({ timeout: 15_000 });
      if (updateRef.current && updateRef.current !== update) {
        await updateRef.current.close().catch(() => {});
      }
      updateRef.current = update;

      if (!update) {
        setState({ ...initialState, status: "upToDate", currentVersion });
        return null;
      }

      setState({
        ...initialState,
        status: "available",
        currentVersion,
        nextVersion: update.version,
        notes: update.body || "",
      });
      return update;
    } catch (error) {
      const message = errorMessage(error);
      setState((value) => ({ ...value, status: "error", error: message }));
      if (!silent) console.error("Update check failed:", error);
      return null;
    } finally {
      checkingRef.current = false;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update || state.status === "downloading") return;

    let downloaded = 0;
    setState((value) => ({ ...value, status: "downloading", downloaded: 0, total: 0, error: "" }));
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setState((value) => ({ ...value, total: event.data.contentLength || 0 }));
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setState((value) => ({ ...value, downloaded }));
        }
      }, { timeout: 60_000 });
      setState((value) => ({ ...value, status: "installed", downloaded: value.total || downloaded }));
    } catch (error) {
      setState((value) => ({ ...value, status: "error", error: errorMessage(error) }));
      console.error("Update installation failed:", error);
    }
  }, [state.status]);

  useEffect(() => {
    if (!isTauri() || startupCheckRef.current) return;
    startupCheckRef.current = true;
    const timer = window.setTimeout(() => checkForUpdates({ silent: true }), 1500);
    return () => {
      window.clearTimeout(timer);
      startupCheckRef.current = false;
    };
  }, [checkForUpdates]);

  useEffect(() => () => {
    updateRef.current?.close().catch(() => {});
  }, []);

  return (
    <UpdateContext.Provider value={{ ...state, supported: isTauri(), checkForUpdates, installUpdate, relaunch }}>
      {children}
    </UpdateContext.Provider>
  );
}

export const useUpdater = () => useContext(UpdateContext);
