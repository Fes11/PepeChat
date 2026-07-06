import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  notify,
  notifyError,
  notifyInfo,
  notifySuccess,
  subscribeToNotifications,
} from "./notificationService";
import classes from "./NotificationProvider.module.css";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  useEffect(() => {
    return subscribeToNotifications((notification) => {
      setNotifications((current) => [...current, notification]);

      window.setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    });
  }, [removeNotification]);

  const value = useMemo(
    () => ({
      notify,
      error: notifyError,
      success: notifySuccess,
      info: notifyInfo,
      remove: removeNotification,
    }),
    [removeNotification],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className={classes.stack} aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={`${classes.notification} ${classes[notification.type]}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className={classes.text}>{notification.message}</span>
          </button>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
};
