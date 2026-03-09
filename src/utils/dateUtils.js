/**
 * Date utilities for South Africa timezone (SAST - UTC+2)
 * These utilities ensure dates are formatted correctly without UTC timezone shifts
 */

// Internal helper — returns "DD/MM/YYYY"
const toDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Internal helper — returns "HH:MM" (24h)
const toHHMM = (date) =>
  date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

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
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const date = parseLocalDate(dateStr);
  if (!date) return "";
  return toDDMMYYYY(date);
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

  if (format === "short" || format === "long") {
    return toDDMMYYYY(date);
  }
  if (format === "time") {
    return toHHMM(date);
  }
  if (format === "datetime") {
    const dPart = toDDMMYYYY(date);
    const tPart = toHHMM(date);
    if (tPart === "00:00") return dPart;
    return `${dPart} - ${tPart}`;
  }
  return toDDMMYYYY(date);
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
 * Get friendly relative time with time of day (e.g., "Today, 06:30" / "Yesterday, 14:15")
 * Falls back to "3d ago" for older dates within a week, then full date
 */
export const getRelativeTimeDetailed = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const time = toHHMM(date);

  // Check if same calendar day
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return `Today, ${time}`;

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday, ${time}`;

  // Within last 7 days — show day name + time
  const diffInDays = Math.floor((now - date) / 86400000);
  if (diffInDays < 7) {
    const dayName = date.toLocaleDateString("en-ZA", { weekday: "short" });
    return `${dayName}, ${time}`;
  }

  // Older — show "5 Jan 2025, 06:30" style with time
  return `${formatDateHuman(dateString)}, ${time}`;
};

/**
 * Format date as "5 Jan 2025" style (human-readable short)
 */
export const formatDateHuman = (dateString) => {
  if (!dateString) return "-";
  let date;
  if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return "-";

  const day = date.getDate();
  const month = date.toLocaleDateString("en-ZA", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format time slot consistently
 */
export const formatTimeSlot = (slot) => {
  if (!slot) return "";
  if (typeof slot === "string") {
    if (slot === "00:00" || slot === "00:00 - 00:00") return "";
    return slot;
  }
  if (slot.start && slot.end) {
    if (slot.start === "00:00" && slot.end === "00:00") return "";
    return `${slot.start} - ${slot.end}`;
  }
  if (slot.start && slot.start !== "00:00") return slot.start;
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
    return `${datePart} - ${timeSlot}`;
  }

  const timePart = formatDate(date, "time");
  // If time is 00:00 (likely unspecified) and no slot, just show date
  if (timePart === "00:00") return datePart;

  return `${datePart} - ${timePart}`;
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
