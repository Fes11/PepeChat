const listeners = new Set();

export const NOTIFICATION_TYPES = {
  ERROR: "error",
  SUCCESS: "success",
  INFO: "info",
};

const getErrorMessage = (error) => {
  if (!error) return "Произошла ошибка";

  if (typeof error === "string") return error;

  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (typeof data?.error === "string") return data.error;
  if (data?.error?.message) return data.error.message;

  if (data && typeof data === "object") {
    const firstValue = Object.values(data).flat()[0];
    if (firstValue) return String(firstValue);
  }

  return error.message || "Произошла ошибка";
};

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
    message: fallbackMessage || getErrorMessage(error),
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
