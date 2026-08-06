import { memo } from "react";
import EmojiGrid from "./EmojiGrid.jsx";
import classes from "./EmojiPicker.module.css";

const EmojiPicker = ({
  activeTab = "emoji",
  onTabChange,
  onEmojiSelect,
  emojis,
  className,
}) => {
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
        <EmojiGrid
          emojis={emojis}
          onEmojiSelect={onEmojiSelect}
          role="tabpanel"
          ariaLabel="Доступные emoji"
        />
      ) : (
        <div className={classes.empty} role="tabpanel">
          Стикеры появятся позже
        </div>
      )}
    </div>
  );
};

export default memo(EmojiPicker);
