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

export default {
  formatLocalDate,
  getTodayString,
  parseLocalDate,
  formatDateDisplay,
  getDateFromToday,
};
