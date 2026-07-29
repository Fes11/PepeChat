import Spinner from "../components/UI/Spiner";
import { useUpdater } from "./UpdateProvider";
import { formatBytes, formatEta, formatSpeed } from "./updateState";
import classes from "./UpdateScreen.module.css";

const PHASE_COPY = {
  idle: {
    title: "Обновление PepeChat",
    message: "Подготавливаем проверку обновлений…",
  },
  checking: {
    title: "Обновление PepeChat",
    message: "Проверяем наличие новой версии…",
  },
  available: {
    title: "Обновление найдено",
    message: "Подготавливаем загрузку новой версии…",
  },
  downloading: {
    title: "Загружаем обновление",
    message: "PepeChat автоматически установит его после загрузки.",
  },
  installing: {
    title: "Устанавливаем обновление",
    message: "Это займёт немного времени. Не закрывайте приложение.",
  },
  installed: {
    title: "Обновление установлено",
    message: "Перезапускаем PepeChat…",
  },
  error: {
    title: "Не удалось обновить PepeChat",
    message: "Можно повторить попытку или продолжить работу с текущей версией.",
  },
};

const UpdateScreen = () => {
  const updater = useUpdater();
  const copy = PHASE_COPY[updater.status] || PHASE_COPY.idle;
  const showProgress = ["downloading", "installing"].includes(updater.status);
  const showLoader = ["idle", "checking", "available", "installing", "installed"].includes(
    updater.status,
  );
  const hasKnownTotal = updater.total > 0;
  const progressValue = hasKnownTotal
    ? Math.min(updater.downloaded, updater.total)
    : undefined;

  return (
    <section
      className={classes.screen}
      aria-live="polite"
      aria-busy={updater.status !== "error"}
    >
      <div className={classes.ambient} aria-hidden="true" />
      <div className={classes.content}>
        <div className={classes.heading}>
          <p className={classes.eyebrow}>PepeChat Updater</p>
          <h1>{copy.title}</h1>
          <p className={classes.message}>
            {updater.status === "error" ? updater.error || copy.message : copy.message}
          </p>
          {updater.nextVersion && updater.status !== "error" && (
            <span className={classes.version}>Версия {updater.nextVersion}</span>
          )}
        </div>

        {showLoader && <Spinner />}

        {showProgress && (
          <div className={classes.progress_block}>
            <div className={classes.progress_row}>
              <div
                className={`${classes.progress_track} ${
                  hasKnownTotal ? "" : classes.progress_track_indeterminate
                }`}
                role="progressbar"
                aria-label="Загрузка обновления"
                aria-valuemin={hasKnownTotal ? 0 : undefined}
                aria-valuemax={hasKnownTotal ? updater.total : undefined}
                aria-valuenow={hasKnownTotal ? progressValue : undefined}
                aria-valuetext={
                  hasKnownTotal ? `${updater.percent ?? 0}%` : "Размер обновления неизвестен"
                }
              >
                {hasKnownTotal && (
                  <span
                    className={classes.progress_fill}
                    style={{ width: `${updater.percent ?? 0}%` }}
                  />
                )}
              </div>
              <span className={classes.percent}>
                {hasKnownTotal ? `${updater.percent ?? 0}%` : "—"}
              </span>
            </div>
            <div className={classes.details}>
              <span>
                {hasKnownTotal
                  ? `${formatBytes(updater.downloaded)} из ${formatBytes(updater.total)}`
                  : `Загружено ${formatBytes(updater.downloaded)}`}
              </span>
              <span>Скорость: {formatSpeed(updater.bytesPerSecond)}</span>
              {hasKnownTotal && updater.status === "downloading" && (
                <span>Осталось: {formatEta(updater.etaSeconds)}</span>
              )}
              {updater.status === "installing" && (
                <span>Загрузка завершена</span>
              )}
            </div>
          </div>
        )}

        {updater.status === "error" && (
          <div className={classes.actions}>
            <button
              type="button"
              className={classes.primary_button}
              onClick={updater.retryUpdate}
            >
              Повторить
            </button>
            <button
              type="button"
              className={classes.secondary_button}
              onClick={updater.continueWithoutUpdate}
            >
              Продолжить
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpdateScreen;
