import { useEffect, useId, useState } from "react";
import classes from "./AvatarPicker.module.css";

const joinClassNames = (...names) => names.filter(Boolean).join(" ");

const AvatarPicker = ({
  avatar = null,
  onSelectAvatar,
  previewSrc = null,
  className,
  accept = "image/*",
  disabled = false,
  ariaLabel = "Выбрать изображение профиля",
}) => {
  const inputId = useId();
  const [localPreview, setLocalPreview] = useState(null);
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = localPreview || previewSrc;

  useEffect(() => {
    if (!avatar) setLocalPreview(null);
  }, [avatar]);

  useEffect(() => {
    setHasImageError(false);
  }, [imageSrc]);

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalPreview(URL.createObjectURL(file));
    onSelectAvatar?.(file);
  };

  const showPreview = Boolean(imageSrc) && !hasImageError;

  return (
    <label
      htmlFor={inputId}
      className={joinClassNames(classes.picker, className)}
      aria-disabled={disabled}
    >
      <span className={classes.placeholder} aria-hidden="true" />

      {showPreview && (
        <img
          src={imageSrc}
          alt=""
          className={classes.preview}
          onError={() => setHasImageError(true)}
        />
      )}

      <img src="/photo.svg" alt="" className={classes.icon} aria-hidden="true" />

      <input
        id={inputId}
        type="file"
        accept={accept}
        className={classes.input}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </label>
  );
};

export default AvatarPicker;
