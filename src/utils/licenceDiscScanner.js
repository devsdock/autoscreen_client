// Reads the PDF417 barcode on a South African licence disc photo in the browser.
// zxing-wasm and its .wasm file are only loaded when a customer actually scans
// (dynamic imports, so neither is in the main bundle), and the .wasm is served
// from this site (Vite `?url`), never from a CDN.
// Same as autoscreen_web/src/utils/licenceDiscScanner.js — change both together.
import { PDF417_READER_OPTIONS, parseLicenceDisc, pickBarcodeText } from "./licenceDisc";

let readerPromise = null;

const loadReader = () => {
  if (!readerPromise) {
    readerPromise = Promise.all([
      import("zxing-wasm/reader"),
      import("zxing-wasm/reader/zxing_reader.wasm?url"),
    ])
      .then(async ([reader, wasm]) => {
        const wasmUrl = wasm.default;
        await reader.prepareZXingModule({
          overrides: {
            locateFile: (path, prefix) => (path.endsWith(".wasm") ? wasmUrl : prefix + path),
          },
          fireImmediately: true,
        });
        return reader;
      })
      .catch((error) => {
        readerPromise = null;
        throw error;
      });
  }
  return readerPromise;
};

const isHeic = (file) =>
  /heic|heif/i.test(file?.type || "") || /\.(heic|heif)$/i.test(file?.name || "");

const loadImageElement = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ source: img, release: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be opened"));
    };
    img.src = url;
  });

// Decodes the photo with the browser (keeps EXIF rotation, handles any format
// the browser can show). HEIC/HEIF falls back to heic2any, already used by the form.
const openImage = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, release: () => bitmap.close?.() };
    } catch {
      // fall through
    }
  }
  try {
    return await loadImageElement(file);
  } catch {
    if (!isHeic(file)) return null;
  }
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    return await loadImageElement(Array.isArray(converted) ? converted[0] : converted);
  } catch {
    return null;
  }
};

const toImageData = (source, maxSide) => {
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

// Full size first (capped), then a smaller copy, which sometimes reads a noisy photo.
const SCAN_SIDES = [2400, 1200];

// Returns { make, model, vin } or null when no licence disc barcode was found.
export const scanLicenceDisc = async (file) => {
  const reader = await loadReader();
  const image = await openImage(file);

  let text = null;
  if (image) {
    try {
      const largest = Math.max(
        image.source.naturalWidth || image.source.width,
        image.source.naturalHeight || image.source.height,
      );
      const sides = [...new Set(SCAN_SIDES.map((side) => Math.min(side, largest)))];
      for (const side of sides) {
        const results = await reader.readBarcodes(
          toImageData(image.source, side),
          PDF417_READER_OPTIONS,
        );
        text = pickBarcodeText(results);
        if (text) break;
      }
    } finally {
      image.release();
    }
  } else {
    // The browser could not open it; let the barcode reader try the file itself.
    text = pickBarcodeText(await reader.readBarcodes(file, PDF417_READER_OPTIONS));
  }

  return text ? parseLicenceDisc(text) : null;
};
