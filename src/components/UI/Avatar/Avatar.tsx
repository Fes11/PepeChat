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
  status?: "online" | "offline" | null;
  fallbackSrc?: string;
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
  status = null,
  fallbackSrc = DEFAULT_AVATAR_FALLBACK,
}: AvatarProps) => {
  const resolvedSrc = useMemo(() => resolveMediaUrl(src), [src]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cssSize = getCssSize(size);
  const shouldUseFallback = !resolvedSrc || failedSrc === resolvedSrc;
  const imageSrc = shouldUseFallback ? fallbackSrc : resolvedSrc;
  const shouldShowStatus = status === "online" || status === "offline";

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
        className={styles.image}
        onError={() => {
          if (!shouldUseFallback && resolvedSrc) {
            setFailedSrc(resolvedSrc);
          }
        }}
      />

      {shouldShowStatus && (
        <span
          className={status === "online" ? styles.online : styles.offline}
          title={status === "online" ? "В сети" : "Не в сети"}
          aria-label={status === "online" ? "В сети" : "Не в сети"}
        />
      )}
    </span>
  );
};

export default Avatar;
