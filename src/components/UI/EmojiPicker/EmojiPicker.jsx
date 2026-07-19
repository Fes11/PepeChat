import { memo, useEffect, useState } from "react";
import defaultEmojis from "../../../utils/emojis.json";
import classes from "./EmojiPicker.module.css";

const INITIAL_VISIBLE_COUNT = 120;
const RENDER_STEP = 120;

const EmojiPicker = ({
  activeTab = "emoji",
  onTabChange,
  onEmojiSelect,
  emojis = defaultEmojis,
  className,
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    if (activeTab !== "emoji") return undefined;

    setVisibleCount(INITIAL_VISIBLE_COUNT);

    let frameId;
    const renderNextBatch = () => {
      setVisibleCount((currentCount) => {
        if (currentCount >= emojis.length) return currentCount;

        frameId = requestAnimationFrame(renderNextBatch);
        return Math.min(currentCount + RENDER_STEP, emojis.length);
      });
    };

    frameId = requestAnimationFrame(renderNextBatch);
    return () => cancelAnimationFrame(frameId);
  }, [activeTab, emojis]);

  const selectTab = (tab) => onTabChange?.(tab);
  const pickerClassName = [classes.picker, className].filter(Boolean).join(" ");

  return (
    <div className={pickerClassName}>
      <div className={classes.tabs} role="tablist" aria-label="Тип реакции">
        <button
          className={`${classes.tab} ${activeTab === "emoji" ? classes.activeTab : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "emoji"}
          onClick={() => selectTab("emoji")}
        >
          Emoji
        </button>
        <button
          className={`${classes.tab} ${activeTab === "stickers" ? classes.activeTab : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "stickers"}
          onClick={() => selectTab("stickers")}
        >
          Стикеры
        </button>
      </div>

      {activeTab === "emoji" ? (
        emojis.length > 0 ? (
          <div className={classes.grid} role="tabpanel">
            {emojis.slice(0, visibleCount).map((emoji, index) => (
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
          </div>
        ) : (
          <div className={classes.empty} role="tabpanel">
            Emoji недоступны
          </div>
        )
      ) : (
        <div className={classes.empty} role="tabpanel">
          Стикеры появятся позже
        </div>
      )}
    </div>
  );
};

export default memo(EmojiPicker);
