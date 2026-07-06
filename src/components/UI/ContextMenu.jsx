import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import cls from "./ContextMenu.module.css";

const MENU_PADDING = 8;

const clampPosition = (x, y, element) => {
  if (!element) return { left: x, top: y };

  const rect = element.getBoundingClientRect();
  const left = Math.min(
    Math.max(MENU_PADDING, x),
    window.innerWidth - rect.width - MENU_PADDING,
  );
  const top = Math.min(
    Math.max(MENU_PADDING, y),
    window.innerHeight - rect.height - MENU_PADDING,
  );

  return { left, top };
};

const ContextMenu = ({ isOpen, x = 0, y = 0, items = [], onClose }) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!isOpen) return;

    setPosition(clampPosition(x, y, menuRef.current));
  }, [isOpen, items, x, y]);

  useEffect(() => {
    if (!isOpen) return;

    const close = () => onClose?.();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) return null;

  const menu = (
    <div
      ref={menuRef}
      className={cls.context_menu}
      style={{ left: position.left, top: position.top }}
      role="menu"
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) => {
        if (item.type === "separator") {
          return <div key={item.id} className={cls.separator} role="separator" />;
        }

        if (item.type === "slider") {
          return (
            <div key={item.id} className={cls.control}>
              <div className={cls.control_header}>
                <span className={cls.control_label}>{item.label}</span>
                <span className={cls.control_value}>{item.valueLabel}</span>
              </div>
              <input
                className={cls.slider}
                type="range"
                min={item.min ?? 0}
                max={item.max ?? 100}
                step={item.step ?? 1}
                value={item.value}
                onChange={(event) => item.onChange?.(event.target.value)}
              />
            </div>
          );
        }

        if (item.render) {
          return <React.Fragment key={item.id}>{item.render({ close: onClose })}</React.Fragment>;
        }

        return (
          <button
            key={item.id}
            className={`${cls.menu_item} ${item.danger ? cls.danger : ""}`}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect?.();
              if (item.closeOnSelect !== false) onClose?.();
            }}
          >
            {item.icon && <span className={cls.icon}>{item.icon}</span>}
            <span className={cls.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return createPortal(menu, document.body);
};

export default ContextMenu;
