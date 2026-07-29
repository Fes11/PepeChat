import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../UI/Modal/Modal";
import { screenShareService } from "../../services/ScreenShareService";
import cls from "./ScreenSharePickerModal.module.css";

const ScreenSharePickerModal = ({ isOpen, onClose, onShare }) => {
  const [tab, setTab] = useState("window");
  const [sources, setSources] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [withAudio, setWithAudio] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const loadRequestRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return undefined;
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
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleSources = useMemo(
    () => sources.filter((source) => source.kind === tab),
    [sources, tab],
  );
  const selected = sources.find((source) => source.id === selectedId);

  const start = async () => {
    if (!selected || isStarting) return;
    setIsStarting(true);
    setError("");
    try {
      await onShare(selected, withAudio);
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
        <>
          <label className={cls.audioToggle}>
            <input
              type="checkbox"
              checked={withAudio}
              onChange={(event) => setWithAudio(event.target.checked)}
            />
            Передавать звук
          </label>
          <button className={cls.cancel} type="button" onClick={onClose} disabled={isStarting}>
            Отмена
          </button>
          <button className={cls.share} type="button" onClick={start} disabled={!selected || isStarting}>
            {isStarting ? "Запуск…" : "Поделиться"}
          </button>
        </>
      }
    >
      <div className={cls.tabs} role="tablist">
        <button className={tab === "window" ? cls.activeTab : ""} onClick={() => setTab("window")}>
          Приложения
        </button>
        <button className={tab === "screen" ? cls.activeTab : ""} onClick={() => setTab("screen")}>
          Экраны
        </button>
      </div>
      {error && <p className={cls.error}>{error}</p>}
      {isLoading && visibleSources.length === 0 ? (
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
