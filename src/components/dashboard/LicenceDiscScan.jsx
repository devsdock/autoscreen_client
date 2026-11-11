import React, { useRef, useState } from "react";
import { ScanLine, Camera, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { scanLicenceDisc } from "../../utils/licenceDiscScanner";

const FAILED_MESSAGE =
  "We couldn't read the disc. Try a clearer, closer photo, or fill in the details yourself.";

/**
 * "Scan licence disc" on the quote form's Vehicle step (3 Nov 2026).
 * Phones open the back camera (capture="environment"); desktops pick a photo.
 * `onResult({ make, model, vin })` fills the form; it may be async.
 * Same behaviour as autoscreen_web/src/components/common/LicenceDiscScan.jsx.
 */
const LicenceDiscScan = ({ onResult, disabled = false }) => {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | reading | done | error
  const [message, setMessage] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    // Clear so picking the same photo again still fires a change.
    event.target.value = "";
    if (!file) return;

    setStatus("reading");
    setMessage("");
    try {
      const result = await scanLicenceDisc(file);
      if (!result) throw new Error("No licence disc barcode found");
      await onResult(result);
      setStatus("done");
      setMessage(
        result.vin
          ? "Make, model and VIN filled in. Check them below and pick the year."
          : "Make and model filled in. Check them below and pick the year.",
      );
    } catch (error) {
      console.warn("Licence disc scan failed:", error);
      setStatus("error");
      setMessage(FAILED_MESSAGE);
    }
  };

  const reading = status === "reading";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-[10px] bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
            <ScanLine size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Scan your licence disc
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              We fill in the make, model and VIN from the barcode.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              We use it only to identify your vehicle for this quote.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || reading}
          aria-busy={reading}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-primary-300 dark:border-primary-700 bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 text-sm font-semibold transition-[transform,background-color] duration-150 ease-out hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 flex-shrink-0"
        >
          {reading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {reading ? "Reading disc..." : "Scan licence disc"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      <div aria-live="polite">
        {message && (
          <p
            className={`mt-3 flex items-start gap-2 text-sm ${
              status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {status === "error" ? (
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            )}
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LicenceDiscScan;
