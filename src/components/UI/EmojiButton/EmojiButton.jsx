import classes from "./EmojiButton.module.css";

const EmojiButton = ({
  className,
  isOpen = false,
  ariaLabel = "Открыть выбор emoji",
  ...props
}) => (
  <button
    {...props}
    type="button"
    className={[classes.button, className].filter(Boolean).join(" ")}
    aria-label={ariaLabel}
    aria-expanded={isOpen}
  >
    <img src="/smile.svg" alt="" aria-hidden="true" />
  </button>
);

export default EmojiButton;
