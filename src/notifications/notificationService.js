const listeners = new Set();

export const NOTIFICATION_TYPES = {
  ERROR: "error",
  SUCCESS: "success",
  INFO: "info",
};

import { getErrorMessage } from "../utils/errors";

export const subscribeToNotifications = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notify = ({
  type = NOTIFICATION_TYPES.INFO,
  message,
  duration = 2000,
} = {}) => {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message: message || "Новое уведомление",
    duration,
  };

  listeners.forEach((listener) => listener(notification));
  return notification.id;
};

export const notifyError = (error, fallbackMessage) =>
  notify({
    type: NOTIFICATION_TYPES.ERROR,
    message: getErrorMessage(error, fallbackMessage),
  });

export const notifySuccess = (message) =>
  notify({
    type: NOTIFICATION_TYPES.SUCCESS,
    message,
  });

export const notifyInfo = (message) =>
  notify({
    type: NOTIFICATION_TYPES.INFO,
    message,
  });
