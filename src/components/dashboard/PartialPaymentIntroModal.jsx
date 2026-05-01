import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Shield, ArrowRight, X, Wallet, CreditCard } from "lucide-react";

/**
 * PartialPaymentIntroModal
 *
 * Step 1 of the partial-payment accept flow (Points 1-2, April 2026).
 * Renders a friendly explainer modal BEFORE the customer picks a balance
 * payment method. Pure presentation — no API calls, no commit. Continue
 * advances to the next modal (PaymentMethodModal); Cancel aborts.
 *
 * Props:
 *   isOpen            — boolean
 *   onContinue        — fired when customer clicks Continue
 *   onCancel          — fired when modal is closed without continuing
 *   total             — full job total (R)
 *   depositPercentage — e.g. 40
 *   balancePercentage — e.g. 60
 *   providerName      — display name (optional)
 */
const PartialPaymentIntroModal = ({
  isOpen,
  onContinue,
  onCancel,
  total = 0,
  depositPercentage = 40,
  balancePercentage = 60,
  providerName = "this provider",
}) => {
  // ESC closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const numericTotal = Number(total) || 0;
  const depositAmount =
    Math.round((numericTotal * depositPercentage) / 100 * 100) / 100;
  const balanceAmount = Math.round((numericTotal - depositAmount) * 100) / 100;
  const fmt = (n) =>
    `R ${Number(n).toLocaleString("en-US", {
      minimumFractionDigits: numericTotal % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="partial-intro-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl animate-scale-in overflow-hidden"
        >
          {/* Header — gradient with shield icon */}
          <div
            className="relative px-5 pt-6 pb-5 text-white"
            style={{
              background: "linear-gradient(135deg, #1e40af, #1e3a8a)",
            }}
          >
            <button
              onClick={onCancel}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2
                  id="partial-intro-title"
                  className="text-[1.125rem] font-bold leading-tight"
                >
                  Partial Payment
                </h2>
                <p className="text-[0.8125rem] text-white/80 mt-0.5 leading-tight">
                  Confirm your booking with a deposit
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            <p className="text-[0.875rem] text-slate-600 dark:text-slate-300 leading-relaxed">
              {providerName} accepts a deposit upfront to confirm your
              booking. The remaining balance is collected after service is
              complete.
            </p>

            {/* Breakdown card */}
            <div className="rounded-2xl border-[1.5px] border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Pay now row */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-200 dark:border-slate-700">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                >
                  <CreditCard className="w-[16px] h-[16px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                    Pay Now ({depositPercentage}%)
                  </div>
                  <div className="text-[0.8125rem] text-slate-700 dark:text-slate-300">
                    Charged to your card via Paystack
                  </div>
                </div>
                <div className="text-[1.0625rem] font-extrabold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                  {fmt(depositAmount)}
                </div>
              </div>

              {/* Balance row */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-900">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #94a3b8, #64748b)" }}
                >
                  <Wallet className="w-[16px] h-[16px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    After Service ({balancePercentage}%)
                  </div>
                  <div className="text-[0.8125rem] text-slate-700 dark:text-slate-300">
                    Choose how to settle on the next step
                  </div>
                </div>
                <div className="text-[1.0625rem] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {fmt(balanceAmount)}
                </div>
              </div>

              {/* Total row */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-dashed border-slate-300 dark:border-slate-600">
                <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total job value
                </span>
                <span className="text-[0.9375rem] font-bold text-slate-900 dark:text-white">
                  {fmt(numericTotal)}
                </span>
              </div>
            </div>

            <div className="text-[0.75rem] text-slate-500 dark:text-slate-400 leading-relaxed">
              <div className="mb-1.5">
                On the next step, choose how to settle the balance after service:
              </div>
              <ul className="space-y-1 pl-1">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">Cash</strong>
                    {" — "}pay your technician at completion.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">Pay-link</strong>
                    {" — "}we email a secure link after service.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-200">Automatic card charge</strong>
                    {" — "}we save your card and charge it after service.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 flex-wrap">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-[0.8125rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] font-bold text-[0.8125rem] text-white transition-all hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 4px 6px -1px rgba(37,99,235,.25)",
              }}
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PartialPaymentIntroModal;
