import { memo } from "react";
import EmojiGrid from "./EmojiGrid.jsx";
import classes from "./EmojiPicker.module.css";

const DescriptionEmojiPicker = ({ onEmojiSelect, emojis, className }) => {
  const pickerClassName = [classes.picker, classes.emojiOnlyPicker, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={pickerClassName}
      role="group"
      aria-label="Emoji для описания профиля"
    >
      <EmojiGrid
        emojis={emojis}
        onEmojiSelect={onEmojiSelect}
        ariaLabel="Emoji для описания профиля"
      />
    </div>
  );
};

export default memo(DescriptionEmojiPicker);
