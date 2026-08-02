import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../UI/Modal/Modal";
import {
  isDesktopApp,
  screenShareService,
} from "../../services/ScreenShareService";
import {
  DEFAULT_SCREEN_SHARE_QUALITY,
  getScreenShareQuality,
  SCREEN_SHARE_QUALITY_OPTIONS,
  SCREEN_SHARE_QUALITY_STORAGE_KEY,
} from "../../constants/screenShareQuality";
import cls from "./ScreenSharePickerModal.module.css";

const savedQuality = () => {
  try {
    return getScreenShareQuality(
      localStorage.getItem(SCREEN_SHARE_QUALITY_STORAGE_KEY),
    ).id;
  } catch {
    return DEFAULT_SCREEN_SHARE_QUALITY;
  }
};

const ScreenSharePickerModal = ({ isOpen, onClose, onShare }) => {
  const [tab, setTab] = useState("window");
  const [sources, setSources] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [withAudio, setWithAudio] = useState(true);
  const [qualityId, setQualityId] = useState(savedQuality);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const loadRequestRef = useRef(0);
  const qualityMenuRef = useRef(null);
  const desktop = isDesktopApp();

  useEffect(() => {
    if (!isOpen || !desktop) return undefined;
    let cancelled = false;

    const load = async () => {
      const requestId = ++loadRequestRef.current;
      setIsLoading((current) => current || sources.length === 0);
      try {
        const nextSources = await screenShareService.listSources();
        if (cancelled || requestId !== loadRequestRef.current) return;
        setSources(nextSources);
        setSelectedId((current) =>
          nextSources.some((source) => source.id === current) ? current : null,
        );
        setError("");

        const previews = await Promise.allSettled(
          nextSources.map(async (source) => [
            source.id,
            await screenShareService.getThumbnail(source.id),
          ]),
        );
        if (cancelled || requestId !== loadRequestRef.current) return;
        setThumbnails((current) => {
          const next = { ...current };
          previews.forEach((result) => {
            if (result.status === "fulfilled") next[result.value[0]] = result.value[1];
          });
          return next;
        });
      } catch (loadError) {
        if (!cancelled) setError(String(loadError));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      loadRequestRef.current += 1;
    };
  }, [desktop, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!qualityMenuOpen) return undefined;
    const closeMenu = (event) => {
      if (!qualityMenuRef.current?.contains(event.target)) {
        setQualityMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [qualityMenuOpen]);

  useEffect(() => {
    if (!isOpen) setQualityMenuOpen(false);
  }, [isOpen]);

  const visibleSources = useMemo(
    () => sources.filter((source) => source.kind === tab),
    [sources, tab],
  );
  const selected = sources.find((source) => source.id === selectedId);
  const selectedQuality = getScreenShareQuality(qualityId);

  const selectQuality = (nextQualityId) => {
    setQualityId(nextQualityId);
    setQualityMenuOpen(false);
    try {
      localStorage.setItem(SCREEN_SHARE_QUALITY_STORAGE_KEY, nextQualityId);
    } catch {
      // Privacy modes can make localStorage unavailable. The in-memory choice
      // still applies to the current share.
    }
  };

  const start = async () => {
    if ((desktop && !selected) || isStarting) return;
    setIsStarting(true);
    setError("");
    try {
      await onShare(
        selected ?? null,
        desktop ? false : withAudio,
        selectedQuality.id,
      );
      onClose();
    } catch (startError) {
      setError(String(startError));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Выберите источник трансляции"
      size="large"
      closeDisabled={isStarting}
      footer={
        <div className={cls.footerLayout}>
          <label
            className={cls.audioToggle}
            title={
              desktop
                ? "Нативный захват системного звука пока недоступен"
                : undefined
            }
          >
            <input
              type="checkbox"
              checked={desktop ? false : withAudio}
              onChange={(event) => setWithAudio(event.target.checked)}
              disabled={desktop || isStarting}
            />
            {desktop ? "Звук недоступен" : "Передавать звук"}
          </label>
          <div className={cls.qualityControl} ref={qualityMenuRef}>
            <button
              className={cls.qualityButton}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={qualityMenuOpen}
              onClick={() => setQualityMenuOpen((current) => !current)}
              disabled={isStarting}
            >
              <span>
                <small>Качество</small>
                <strong>{selectedQuality.summary}</strong>
              </span>
              <span className={cls.chevron} aria-hidden="true">⌃</span>
            </button>
            {qualityMenuOpen && (
              <div
                className={cls.qualityMenu}
                role="listbox"
                aria-label="Качество трансляции"
              >
                {SCREEN_SHARE_QUALITY_OPTIONS.map((quality) => (
                  <button
                    key={quality.id}
                    type="button"
                    role="option"
                    aria-selected={quality.id === selectedQuality.id}
                    className={
                      quality.id === selectedQuality.id
                        ? cls.qualityOptionSelected
                        : ""
                    }
                    onClick={() => selectQuality(quality.id)}
                  >
                    <span>
                      <strong>{quality.label}</strong>
                      <small>{quality.description}</small>
                    </span>
                    <b>{quality.summary}</b>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={cls.cancel} type="button" onClick={onClose} disabled={isStarting}>
            Отмена
          </button>
          <button
            className={cls.share}
            type="button"
            onClick={start}
            disabled={(desktop && !selected) || isStarting}
          >
            {isStarting
              ? "Запуск…"
              : desktop
                ? "Поделиться"
                : "Выбрать экран"}
          </button>
        </div>
      }
    >
      {desktop && (
        <div className={cls.tabs} role="tablist">
          <button className={tab === "window" ? cls.activeTab : ""} onClick={() => setTab("window")}>
            Приложения
          </button>
          <button className={tab === "screen" ? cls.activeTab : ""} onClick={() => setTab("screen")}>
            Экраны
          </button>
        </div>
      )}
      {error && <p className={cls.error}>{error}</p>}
      {!desktop ? (
        <div className={cls.browserNotice}>
          <span aria-hidden="true">▣</span>
          <strong>Выбор откроется в системном окне браузера</strong>
          <p>
            Выберите экран, окно или вкладку после настройки качества. Для
            передачи звука включите его и разрешите в системном окне.
          </p>
        </div>
      ) : isLoading && visibleSources.length === 0 ? (
        <div className={cls.empty}>Получаем доступные источники…</div>
      ) : visibleSources.length === 0 ? (
        <div className={cls.empty}>Доступные источники не найдены</div>
      ) : (
        <div className={cls.grid}>
          {visibleSources.map((source) => (
            <button
              key={source.id}
              type="button"
              className={`${cls.source} ${selectedId === source.id ? cls.selected : ""}`}
              onClick={() => setSelectedId(source.id)}
            >
              <span className={cls.preview}>
                {thumbnails[source.id] ? <img src={thumbnails[source.id]} alt="" /> : <span>Нет превью</span>}
              </span>
              <strong>{source.title}</strong>
              {(source.appName || (source.width > 0 && source.height > 0)) && (
                <small>
                  {source.appName || `${source.width} × ${source.height}`}
                </small>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ScreenSharePickerModal;
