// South African vehicle licence disc barcode (PDF417) helpers. Pure functions,
// no browser APIs, so the parser can be run and tested in Node as well.
// Same as autoscreen_web/src/utils/licenceDisc.js — change both together.
//
// The disc barcode is plain text, percent-delimited, e.g.
// %MVL1CC28%0158%4025T0HV%1%40250048NFC1%RPN455B%CK07VTGP%Hatch back / Luikrug%
// VOLKSWAGEN%POLO VIVO%White / Wit%AAVZZZ6SZEU015329%CHZ095532%2016-08-31%
// Counted from the MVL marker: description +7, make +8, model +9, colour +10,
// VIN +11, engine number +12, expiry +13. The disc has no model year, and the
// registration number on it is deliberately never read (client decision, 2 Nov 2026).

// Options for zxing-wasm `readBarcodes`, shared by the form scanner and the Node check.
export const PDF417_READER_OPTIONS = {
  formats: ["PDF417"],
  tryHarder: true,
  maxNumberOfSymbols: 1,
};

const MAX_NAME_LENGTH = 60;
const VIN_MAX_LENGTH = 17;

// Uppercase, letters and digits only, at most 17. Used for the VIN field too.
export const cleanVin = (value) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, VIN_MAX_LENGTH);

const cleanName = (value) =>
  String(value ?? "")
    .replace(/\p{Cc}/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);

// "POLO VIVO" -> "Polo Vivo", "MERCEDES-BENZ" -> "Mercedes-Benz".
// Words with a digit keep their capitals ("X5", "320I").
export const titleCaseVehicleName = (value) =>
  cleanName(value)
    .split(" ")
    .map((word) =>
      /\d/.test(word)
        ? word.toUpperCase()
        : word
            .toLowerCase()
            .replace(/(^|[-/'.(])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase()),
    )
    .join(" ");

// Returns { make, model, vin } (vin may be "") or null when the text is not a
// vehicle licence disc.
export const parseLicenceDisc = (text) => {
  if (typeof text !== "string") return null;
  const fields = text.split("%").map((field) => field.trim());
  const marker = fields.findIndex((field) => /^MVL/i.test(field));
  if (marker === -1) return null;
  // Needs at least everything up to the VIN.
  if (fields.length < marker + 12) return null;

  const make = cleanName(fields[marker + 8]);
  const model = cleanName(fields[marker + 9]);
  if (!make || !model) return null;
  // A shifted layout would put a bilingual field ("White / Wit") or a date here.
  const shifted = (value) => /\s\/\s/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (shifted(make) || shifted(model)) return null;

  const vinRaw = cleanVin(fields[marker + 11]);
  // Anything shorter than an old-style chassis number is not trusted.
  const vin = vinRaw.length >= 6 ? vinRaw : "";

  return { make, model, vin };
};

// First readable symbol text from zxing-wasm `readBarcodes` results.
export const pickBarcodeText = (results) => {
  if (!Array.isArray(results)) return null;
  const hit = results.find((result) => result && result.isValid !== false && result.text);
  return hit ? hit.text : null;
};

const nameKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const nameWords = (value) =>
  String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

// Case-insensitive match of a disc value against the database names the form
// already loaded. Exact first (ignoring spaces and punctuation); with
// `allowPrefix`, the longest name whose words start the disc value
// ("COROLLA QUEST 1.6" -> "Corolla Quest"). Returns the option or null.
export const matchVehicleName = (value, options, { allowPrefix = false } = {}) => {
  const key = nameKey(value);
  if (!key || !Array.isArray(options)) return null;
  const names = options.filter((option) => typeof option === "string" && option.trim());
  const exact = names.find((option) => nameKey(option) === key);
  if (exact) return exact;
  if (!allowPrefix) return null;

  const words = nameWords(value);
  let best = null;
  let bestLength = 0;
  names.forEach((option) => {
    const optionWords = nameWords(option);
    if (!optionWords.length || optionWords.length > words.length) return;
    const matches = optionWords.every((word, i) => words[i] === word);
    if (matches && optionWords.length > bestLength) {
      best = option;
      bestLength = optionWords.length;
    }
  });
  return best;
};
