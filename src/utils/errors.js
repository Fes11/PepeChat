const DEFAULT_ERROR_MESSAGE = "Не удалось выполнить действие. Попробуйте ещё раз.";

const NETWORK_ERROR_MESSAGE =
  "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.";

const extractMessages = (value) => {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractMessages);
  if (typeof value === "object") {
    if (typeof value.message === "string") return [value.message];
    return Object.values(value).flatMap(extractMessages);
  }
  return [String(value)];
};

const responseData = (error) => error?.response?.data;

export const normalizeApiErrors = (error, fallbackMessage = DEFAULT_ERROR_MESSAGE) => {
  if (typeof error === "string") return { non_field_errors: [error] };

  const data = responseData(error);

  if (!data) {
    const message = error?.request ? NETWORK_ERROR_MESSAGE : fallbackMessage;
    return { non_field_errors: [message] };
  }

  if (typeof data === "string") return { non_field_errors: [data] };

  const contractError = data.error;
  const fieldErrors = contractError?.field_errors;
  const normalized = {};

  if (fieldErrors && typeof fieldErrors === "object") {
    Object.entries(fieldErrors).forEach(([field, value]) => {
      const messages = extractMessages(value);
      if (messages.length) normalized[field] = messages;
    });
  }

  // Also support legacy/non-contract DRF responses during a rolling upgrade.
  if (!fieldErrors) {
    Object.entries(data).forEach(([field, value]) => {
      if (["error", "detail", "message", "trace_id"].includes(field)) return;
      const messages = extractMessages(value);
      if (messages.length) normalized[field] = messages;
    });
  }

  const hasFieldErrors = Object.keys(normalized).some(
    (field) => field !== "non_field_errors",
  );
  const formMessages = extractMessages(
    normalized.non_field_errors ??
      (!hasFieldErrors
        ? (typeof contractError === "string" ? contractError : contractError?.message) ??
          data.detail ??
          data.message
        : null),
  );

  if (formMessages.length && !normalized.non_field_errors) {
    normalized.non_field_errors = formMessages;
  }

  if (!Object.keys(normalized).length) {
    normalized.non_field_errors = [fallbackMessage];
  }

  return normalized;
};

export const getFieldError = (errors, field) =>
  extractMessages(errors?.[field]).join(" ");

export const getErrorMessage = (error, fallbackMessage = DEFAULT_ERROR_MESSAGE) => {
  const errors = normalizeApiErrors(error, fallbackMessage);
  const formError = getFieldError(errors, "non_field_errors");
  if (formError) return formError;

  return Object.values(errors).flatMap(extractMessages).join(" ") || fallbackMessage;
};
