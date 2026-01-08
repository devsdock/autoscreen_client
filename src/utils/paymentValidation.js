/**
 * Payment Form Validation Utilities
 * Handles card number formatting, validation, and field restrictions
 */

/**
 * Format card number with spaces (4 digits per group)
 * @param {string} value - Raw card number input
 * @returns {string} Formatted card number (e.g., "4242 4242 424242")
 */
export const formatCardNumber = (value) => {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, "");

  // Limit to 16 digits
  const limited = digitsOnly.slice(0, 16);

  // Add space every 4 digits
  const formatted = limited.replace(/(\d{4})(?=\d)/g, "$1 ");

  return formatted;
};

/**
 * Format expiry date as MM/YY
 * @param {string} value - Raw expiry input
 * @returns {string} Formatted expiry (e.g., "12/25")
 */
export const formatExpiry = (value) => {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, "");

  // Limit to 4 digits
  const limited = digitsOnly.slice(0, 4);

  // Only add slash if there are 3 or more digits (makes backspace easier)
  if (limited.length >= 3) {
    return limited.slice(0, 2) + "/" + limited.slice(2);
  }

  return limited;
};

/**
 * Format CVV (3 digits)
 * @param {string} value - Raw CVV input
 * @returns {string} Formatted CVV
 */
export const formatCVV = (value) => {
  return value.replace(/\D/g, "").slice(0, 3);
};

/**
 * Validate card number using Luhn algorithm
 * @param {string} cardNumber - Card number (with or without spaces)
 * @returns {boolean} True if valid
 */
export const validateCardNumber = (cardNumber) => {
  const digits = cardNumber.replace(/\s/g, "");

  // Must be 16 digits
  if (digits.length !== 16 || !/^\d+$/.test(digits)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate expiry date
 * @param {string} expiry - Expiry in MM/YY format
 * @returns {boolean} True if valid and not expired
 */
export const validateExpiry = (expiry) => {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split("/").map(Number);

  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }

  // Check if expired
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Last 2 digits
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
};

/**
 * Validate CVV
 * @param {string} cvv - CVV code
 * @returns {boolean} True if valid
 */
export const validateCVV = (cvv) => {
  return /^\d{3}$/.test(cvv);
};

/**
 * Validate cardholder name
 * @param {string} name - Cardholder name
 * @returns {boolean} True if valid
 */
export const validateCardholderName = (name) => {
  return name.trim().length >= 3;
};

/**
 * Validate entire card form
 * @param {Object} cardDetails - Card details object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateCardForm = (cardDetails) => {
  const errors = {};

  const cleanNumber = cardDetails.number
    ? cardDetails.number.replace(/\s/g, "")
    : "";

  if (!cleanNumber) {
    errors.number = "Card number is required";
  } else if (cleanNumber.length !== 16) {
    errors.number = `Card number must be 16 digits (currently ${cleanNumber.length})`;
  } else if (!validateCardNumber(cardDetails.number)) {
    errors.number = "Invalid card number (check for typos)";
  }

  if (!cardDetails.expiry || !validateExpiry(cardDetails.expiry)) {
    errors.expiry = "Please enter a valid expiry date (MM/YY)";
  }

  if (!cardDetails.cvv || !validateCVV(cardDetails.cvv)) {
    errors.cvv = "Please enter a valid 3-digit CVV";
  }

  if (!cardDetails.name || !validateCardholderName(cardDetails.name)) {
    errors.name = "Please enter cardholder name (min 3 characters)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get card type from card number
 * @param {string} cardNumber - Card number
 * @returns {string} Card type (visa, mastercard, amex, etc.)
 */
export const getCardType = (cardNumber) => {
  const digits = cardNumber.replace(/\s/g, "");

  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";

  return "unknown";
};
