import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import styles from "./Avatar.module.css";

export const DEFAULT_AVATAR_SIZE = 32;
export const DEFAULT_AVATAR_FALLBACK = "/default.jpg";

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: number | string;
  shape?: "circle" | "rounded";
  className?: string;
  status?: "online" | "away" | "offline" | null;
  fallbackSrc?: string;
  title?: string;
};

const getCssSize = (size: AvatarProps["size"]): string => {
  if (typeof size === "number") {
    return Number.isFinite(size) && size > 0
      ? `${size}px`
      : `${DEFAULT_AVATAR_SIZE}px`;
  }

  if (typeof size === "string" && size.trim()) {
    return size.trim();
  }

  return `${DEFAULT_AVATAR_SIZE}px`;
};

const Avatar = ({
  src,
  alt = "Аватар",
  size = DEFAULT_AVATAR_SIZE,
  shape = "circle",
  className,
  title,
  status = null,
  fallbackSrc = DEFAULT_AVATAR_FALLBACK,
}: AvatarProps) => {
  const resolvedSrc = useMemo(() => resolveMediaUrl(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cssSize = getCssSize(size);
  const shouldUseFallback = !resolvedSrc || failedSrc === resolvedSrc;
  const imageSrc = shouldUseFallback ? fallbackSrc : resolvedSrc;
  const shouldShowStatus = ["online", "away", "offline"].includes(status ?? "");
  const statusLabel = status === "online"
    ? "В сети"
    : status === "away"
      ? "Отошёл"
      : "Не в сети";

  useEffect(() => {
    setFailedSrc(null);
  }, [resolvedSrc]);

  return (
    <span
      className={[
        styles.avatar,
        shape === "rounded" ? styles.rounded : styles.circle,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--avatar-size": cssSize } as CSSProperties}
    >
      <img
        src={imageSrc}
        alt={alt}
        title={title}
        className={styles.image}
        onError={() => {
          if (!shouldUseFallback && resolvedSrc) {
            setFailedSrc(resolvedSrc);
          }
        }}
      />

      {shouldShowStatus && (
        <span
          className={styles[status as "online" | "away" | "offline"]}
          title={statusLabel}
          aria-label={statusLabel}
        >
          {status === "away" && (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M11.8 11.5A5.7 5.7 0 0 1 5.1 4.2a5.2 5.2 0 1 0 6.7 7.3Z" />
            </svg>
          )}
        </span>
      )}
    </span>
  );
};

export default Avatar;
