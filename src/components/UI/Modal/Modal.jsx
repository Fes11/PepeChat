import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import cls from "./Modal.module.css";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "medium",
  className = "",
  contentClassName = "",
  contentFlush = false,
  closeDisabled = false,
  closeOnOverlay = true,
}) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const focusable = dialogRef.current?.querySelector(FOCUSABLE);
      (focusable || dialogRef.current)?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !closeDisabled) {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const items = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (!items.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [closeDisabled, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cls.overlay}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          closeOnOverlay &&
          !closeDisabled
        ) {
          onClose?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        className={`${cls.modal} ${cls[size] || cls.medium} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {title && (
          <header className={cls.header}>
            <h2 id={titleId}>{title}</h2>
            <button
              className={cls.close}
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Закрыть"
            >
              ×
            </button>
          </header>
        )}
        <div
          className={`${cls.content} ${contentFlush ? cls.contentFlush : ""} ${contentClassName}`}
        >
          {children}
        </div>
        {footer && <footer className={cls.footer}>{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
};

export default Modal;
