const pad = (value) => String(value).padStart(2, "0");

const parseTimestamp = (dateString) => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDateKeyFromTimestamp = (dateString) => {
  const date = parseTimestamp(dateString);
  if (!date) return "";

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

export const formatDateTime = (dateString) => {
  const date = parseTimestamp(dateString);
  if (!date) return "-";

  return `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

export const formatTime = (dateString) => {
  const date = parseTimestamp(dateString);
  if (!date) return "-";

  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};
