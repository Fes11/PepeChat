import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import defaultEmojis from "../../../utils/emojis.json";
import classes from "./EmojiPicker.module.css";

const INITIAL_VISIBLE_COUNT = 96;
const RENDER_STEP = 64;
const LOAD_AHEAD_PX = 160;

const EmojiGrid = ({
  onEmojiSelect,
  emojis = defaultEmojis,
  role,
  ariaLabel = "Emoji",
}) => {
  const gridRef = useRef(null);
  const loadMoreRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_VISIBLE_COUNT, emojis.length),
  );

  const hasMore = visibleCount < emojis.length;
  const visibleEmojis = useMemo(
    () => emojis.slice(0, visibleCount),
    [emojis, visibleCount],
  );

  const loadNextBatch = useCallback(() => {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + RENDER_STEP, emojis.length),
    );
  }, [emojis.length]);

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, emojis.length));
    if (gridRef.current) gridRef.current.scrollTop = 0;
  }, [emojis]);

  useEffect(() => {
    if (!hasMore) return undefined;

    const grid = gridRef.current;
    const loadMore = loadMoreRef.current;
    if (!grid || !loadMore) return undefined;

    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadNextBatch();
        },
        {
          root: grid,
          rootMargin: `${LOAD_AHEAD_PX}px 0px`,
        },
      );

      observer.observe(loadMore);
      return () => observer.disconnect();
    }

    const loadWhenNearEnd = () => {
      const remaining = grid.scrollHeight - grid.scrollTop - grid.clientHeight;
      if (remaining <= LOAD_AHEAD_PX) loadNextBatch();
    };

    grid.addEventListener("scroll", loadWhenNearEnd, { passive: true });
    loadWhenNearEnd();
    return () => grid.removeEventListener("scroll", loadWhenNearEnd);
  }, [hasMore, loadNextBatch, visibleCount]);

  if (emojis.length === 0) {
    return (
      <div className={classes.empty} role={role} aria-label={ariaLabel}>
        Emoji недоступны
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className={classes.grid}
      role={role}
      aria-label={ariaLabel}
    >
      {visibleEmojis.map((emoji, index) => (
        <button
          className={classes.item}
          type="button"
          key={`${emoji}-${index}`}
          aria-label={`Добавить ${emoji}`}
          onClick={() => onEmojiSelect?.(emoji)}
        >
          {emoji}
        </button>
      ))}
      {hasMore && (
        <span
          ref={loadMoreRef}
          className={classes.loadMore}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default memo(EmojiGrid);
