/**
 * Date utilities for South Africa timezone (SAST - UTC+2)
 * These utilities ensure dates are formatted correctly without UTC timezone shifts
 */

/**
 * Format a Date object as YYYY-MM-DD string in local timezone
 * @param {Date} date - Date object to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatLocalDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return formatLocalDate(new Date());
};

/**
 * Parse a YYYY-MM-DD string to a Date object without timezone shift
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a date string for display (e.g., "7 Jan 2026")
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (dateStr, options = {}) => {
  if (!dateStr) return "";
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

/**
 * Get date N days from today as YYYY-MM-DD string
 * @param {number} days - Number of days from today
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getDateFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

/**
 * Format a date with various options
 */
export const formatDate = (dateString, format = "short") => {
  if (!dateString) return "-";

  let date;
  if (
    typeof dateString === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    const [y, m, d] = dateString.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return "-";

  if (format === "short") {
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (format === "long") {
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (format === "time") {
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (format === "datetime") {
    return `${formatDate(dateString, "short")} at ${formatDate(
      dateString,
      "time",
    )}`;
  }
  return date.toLocaleDateString("en-ZA");
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(dateString);
};

/**
 * Format time slot consistently
 */
export const formatTimeSlot = (slot) => {
  if (!slot) return "";
  if (typeof slot === "string") return slot;
  if (slot.start && slot.end) return `${slot.start} - ${slot.end}`;
  if (slot.start) return slot.start;
  return "";
};

/**
 * Combine date and time slot for display
 */
export const formatDateTime = (date, slot) => {
  if (!date) return "-";
  const datePart = formatDate(date, "short");
  const timeSlot = formatTimeSlot(slot);

  if (timeSlot) {
    return `${datePart} at ${timeSlot}`;
  }

  const timePart = formatDate(date, "time");
  // If time is 00:00 (likely unspecified) and no slot, just show date
  if (timePart === "00:00") return datePart;

  return `${datePart} at ${timePart}`;
};

export default {
  formatLocalDate,
  getTodayString,
  parseLocalDate,
  formatDateDisplay,
  getDateFromToday,
  formatDate,
  getRelativeTime,
  formatTimeSlot,
  formatDateTime,
};
