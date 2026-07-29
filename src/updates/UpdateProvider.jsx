import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { createInitialUpdateState, updateReducer } from "./updateState";

const UpdateContext = createContext(null);
const isTauri = () => Boolean(window.__TAURI_INTERNALS__);

const errorMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (/timed?\s*out|network|connect|dns|offline|fetch/i.test(message)) {
    return "Не удалось подключиться к серверу обновлений. Проверьте интернет и повторите попытку.";
  }
  return message || "Не удалось выполнить обновление.";
};

export function UpdateProvider({ children }) {
  const [state, dispatch] = useReducer(
    updateReducer,
    undefined,
    createInitialUpdateState,
  );
  const stateRef = useRef(state);
  const updateRef = useRef(null);
  const operationRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const replaceUpdate = useCallback(async (update) => {
    const previousUpdate = updateRef.current;
    updateRef.current = update;
    if (previousUpdate && previousUpdate !== update) {
      await previousUpdate.close().catch(() => {});
    }
  }, []);

  const relaunchApplication = useCallback(async () => {
    try {
      await relaunch();
      return true;
    } catch (error) {
      dispatch({
        type: "ERROR",
        phase: "relaunch",
        error: errorMessage(error),
      });
      console.error("Application relaunch failed:", error);
      return false;
    }
  }, []);

  const downloadAndInstall = useCallback(
    async (update, source) => {
      let downloaded = 0;
      let lastUiUpdate = 0;
      dispatch({ type: "START_DOWNLOAD", source });

      try {
        await update.downloadAndInstall((event) => {
          const now = performance.now();
          if (event.event === "Started") {
            dispatch({
              type: "DOWNLOAD_STARTED",
              total: event.data.contentLength || 0,
            });
            return;
          }

          if (event.event === "Progress") {
            downloaded += event.data.chunkLength;
            if (now - lastUiUpdate >= 250) {
              dispatch({
                type: "DOWNLOAD_PROGRESS",
                chunkLength: downloaded,
                now,
              });
              downloaded = 0;
              lastUiUpdate = now;
            }
            return;
          }

          if (downloaded > 0) {
            dispatch({
              type: "DOWNLOAD_PROGRESS",
              chunkLength: downloaded,
              now,
            });
            downloaded = 0;
          }
          dispatch({ type: "DOWNLOAD_FINISHED" });
        });
      } catch (error) {
        dispatch({
          type: "ERROR",
          phase: "install",
          error: errorMessage(error),
        });
        console.error("Update installation failed:", error);
        return false;
      }

      dispatch({ type: "INSTALLED" });
      return relaunchApplication();
    },
    [relaunchApplication],
  );

  const performCheck = useCallback(
    async ({ source, installWhenAvailable, showScreen }) => {
      if (!isTauri()) {
        if (source === "startup") dispatch({ type: "BYPASS_STARTUP" });
        return null;
      }
      if (operationRef.current) return null;

      operationRef.current = true;
      dispatch({ type: "START_CHECK", source, showScreen });

      try {
        const currentVersion = await getVersion();
        const update = await check({ timeout: 15_000 });
        await replaceUpdate(update);

        if (!update) {
          dispatch({ type: "UP_TO_DATE", currentVersion });
          return null;
        }

        dispatch({
          type: "AVAILABLE",
          currentVersion,
          nextVersion: update.version,
          notes: update.body || "",
        });

        if (installWhenAvailable) {
          await downloadAndInstall(update, source);
        }
        return update;
      } catch (error) {
        dispatch({
          type: "ERROR",
          phase: "check",
          error: errorMessage(error),
        });
        console.error("Update check failed:", error);
        return null;
      } finally {
        operationRef.current = false;
      }
    },
    [downloadAndInstall, replaceUpdate],
  );

  const runStartupUpdate = useCallback(
    () =>
      performCheck({
        source: "startup",
        installWhenAvailable: true,
        showScreen: true,
      }),
    [performCheck],
  );

  const checkForUpdates = useCallback(
    () =>
      performCheck({
        source: "manual",
        installWhenAvailable: false,
        showScreen: false,
      }),
    [performCheck],
  );

  const installUpdate = useCallback(async () => {
    if (!isTauri() || operationRef.current || !updateRef.current) return false;
    operationRef.current = true;
    try {
      return await downloadAndInstall(updateRef.current, "manual");
    } finally {
      operationRef.current = false;
    }
  }, [downloadAndInstall]);

  const retryUpdate = useCallback(async () => {
    const current = stateRef.current;
    if (current.errorPhase === "relaunch") {
      if (operationRef.current) return false;
      operationRef.current = true;
      try {
        dispatch({ type: "INSTALLED" });
        return await relaunchApplication();
      } finally {
        operationRef.current = false;
      }
    }

    return performCheck({
      source: current.source || "startup",
      installWhenAvailable:
        current.source === "startup" || current.errorPhase === "install",
      showScreen: current.source === "startup" || current.errorPhase === "install",
    });
  }, [performCheck, relaunchApplication]);

  const continueWithoutUpdate = useCallback(() => {
    dispatch({ type: "CONTINUE" });
  }, []);

  useEffect(
    () => () => {
      updateRef.current?.close().catch(() => {});
    },
    [],
  );

  return (
    <UpdateContext.Provider
      value={{
        ...state,
        supported: isTauri(),
        runStartupUpdate,
        checkForUpdates,
        installUpdate,
        retryUpdate,
        continueWithoutUpdate,
        relaunch: relaunchApplication,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export const useUpdater = () => useContext(UpdateContext);
