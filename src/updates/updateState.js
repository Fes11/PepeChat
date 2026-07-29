const emptyMetrics = () => ({
  downloaded: 0,
  total: 0,
  percent: null,
  bytesPerSecond: 0,
  etaSeconds: null,
  samples: [],
});

export const createInitialUpdateState = () => ({
  status: "idle",
  currentVersion: "",
  nextVersion: "",
  notes: "",
  error: "",
  errorPhase: "",
  source: null,
  startupComplete: false,
  isUpdateScreenVisible: false,
  ...emptyMetrics(),
});

const calculateMetrics = (state, chunkLength, now) => {
  const downloaded = state.downloaded + Math.max(0, chunkLength || 0);
  const samples = [...state.samples, { bytes: downloaded, at: now }].filter(
    (sample) => now - sample.at <= 4_000,
  );
  const firstSample = samples[0];
  const elapsedSeconds = firstSample ? (now - firstSample.at) / 1_000 : 0;
  const transferredBytes = firstSample ? downloaded - firstSample.bytes : 0;
  const bytesPerSecond =
    elapsedSeconds > 0 ? transferredBytes / elapsedSeconds : 0;
  const percent = state.total
    ? Math.min(100, Math.round((downloaded / state.total) * 100))
    : null;
  const remainingBytes = state.total
    ? Math.max(0, state.total - downloaded)
    : 0;
  const etaSeconds =
    state.total && bytesPerSecond > 0
      ? Math.ceil(remainingBytes / bytesPerSecond)
      : null;

  return {
    downloaded,
    samples,
    percent,
    bytesPerSecond,
    etaSeconds,
  };
};

export const updateReducer = (state, action) => {
  switch (action.type) {
    case "START_CHECK":
      return {
        ...createInitialUpdateState(),
        currentVersion: state.currentVersion,
        status: "checking",
        source: action.source,
        startupComplete:
          action.source === "startup" ? false : state.startupComplete,
        isUpdateScreenVisible: Boolean(action.showScreen),
      };
    case "AVAILABLE":
      return {
        ...state,
        status: "available",
        currentVersion: action.currentVersion,
        nextVersion: action.nextVersion,
        notes: action.notes,
      };
    case "UP_TO_DATE":
      return {
        ...state,
        status: "upToDate",
        currentVersion: action.currentVersion,
        startupComplete:
          state.source === "startup" ? true : state.startupComplete,
        isUpdateScreenVisible: false,
      };
    case "START_DOWNLOAD":
      return {
        ...state,
        status: "downloading",
        source: action.source,
        error: "",
        errorPhase: "",
        isUpdateScreenVisible: true,
        ...emptyMetrics(),
      };
    case "DOWNLOAD_STARTED":
      return {
        ...state,
        total: Math.max(0, action.total || 0),
      };
    case "DOWNLOAD_PROGRESS":
      return {
        ...state,
        ...calculateMetrics(state, action.chunkLength, action.now),
      };
    case "DOWNLOAD_FINISHED": {
      const downloaded = state.total || state.downloaded;
      return {
        ...state,
        status: "installing",
        downloaded,
        percent: state.total ? 100 : null,
        etaSeconds: state.total ? 0 : null,
      };
    }
    case "INSTALLED":
      return {
        ...state,
        status: "installed",
        downloaded: state.total || state.downloaded,
        percent: state.total ? 100 : null,
      };
    case "ERROR":
      return {
        ...state,
        status: "error",
        error: action.error,
        errorPhase: action.phase,
      };
    case "CONTINUE":
      return {
        ...state,
        startupComplete:
          state.source === "startup" ? true : state.startupComplete,
        isUpdateScreenVisible: false,
      };
    case "BYPASS_STARTUP":
      return {
        ...state,
        startupComplete: true,
        isUpdateScreenVisible: false,
      };
    default:
      return state;
  }
};

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 МБ";
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} МБ`;
};

export const formatSpeed = (bytesPerSecond) =>
  bytesPerSecond > 0 ? `${formatBytes(bytesPerSecond)}/с` : "—";

export const formatEta = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))} сек.`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} мин.`;
};
