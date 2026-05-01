import { useState, useEffect, useRef } from "react";
import { CreditCard, Lock, AlertCircle, Check, X } from "lucide-react";
import useDashboardStore, {
  formatCurrency,
} from "../../store/useDashboardStore";
import paymentService from "../../services/paymentService";
import {
  getCancellationPolicy,
  getPartialPaymentConfig,
} from "../../services/publicSettingsService";

const PAYSTACK_ALLOWED_HOSTS = [
  "https://checkout.paystack.com/",
  "https://standard.paystack.co/",
];

const isPaystackUrl = (url) =>
  PAYSTACK_ALLOWED_HOSTS.some((prefix) => url.startsWith(prefix));

const PaymentModal = ({ payment, isOpen, onClose, onSuccess }) => {
  const { addToast } = useDashboardStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [coversFees, setCoversFees] = useState(false);
  const [surcharge, setSurcharge] = useState(0);
  const [variableFeeRate, setVariableFeeRate] = useState(0.029 * 1.15);
  const [policyText, setPolicyText] = useState("");
  // Partial Payment config (Points 1-2, April 2026)
  const [partialConfig, setPartialConfig] = useState({
    isActive: false,
    depositPercentage: 100,
    balancePercentage: 0,
  });
  const modalRef = useRef(null);

  // Fetch fee rate, cancellation policy, and partial-payment config from backend
  useEffect(() => {
    paymentService
      .getPaystackConfig()
      .then((res) => {
        if (res.success && res.variableFeeRate) setVariableFeeRate(res.variableFeeRate);
      })
      .catch(() => {});

    getCancellationPolicy()
      .then((data) => {
        if (data.isActive && data.policyText) setPolicyText(data.policyText);
      })
      .catch(() => {});

    getPartialPaymentConfig()
      .then((data) => {
        if (data?.isActive) setPartialConfig(data);
      })
      .catch(() => {});
  }, []);

  // Partial Payment math — derived once per render. When inactive, deposit
  // equals total and balance is 0 (legacy "Accept & Pay in Full" behavior).
  // Insurance R0 quotes (where customer owes nothing) bypass partial logic.
  const isInsuranceR0 = payment?.isInsuranceRegistered && payment?.amount === 0;
  const partialActive =
    partialConfig.isActive && !isInsuranceR0 && (payment?.amount || 0) > 0;
  const depositAmount = partialActive
    ? Math.round((payment.amount * partialConfig.depositPercentage) / 100 * 100) / 100
    : (payment?.amount || 0);
  const balanceAmount = partialActive
    ? Math.round((payment.amount - depositAmount) * 100) / 100
    : 0;

  // Calculate surcharge — applied only to what Paystack actually charges
  // (the deposit when partial active, otherwise the full amount).
  useEffect(() => {
    const chargeAmount = partialActive ? depositAmount : payment?.amount;
    if (coversFees && chargeAmount) {
      const calculatedSurcharge =
        chargeAmount / (1 - variableFeeRate) - chargeAmount;
      setSurcharge(Math.round(calculatedSurcharge * 100) / 100);
    } else {
      setSurcharge(0);
    }
  }, [coversFees, payment?.amount, variableFeeRate, partialActive, depositAmount]);

  // Escape key + body scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading) handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, loading]);

  useEffect(() => {
    if (isOpen && modalRef.current) modalRef.current.focus();
  }, [isOpen]);

  if (!payment || !isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      const params = payment.quoteId && payment.responseId
        ? { quoteId: payment.quoteId, responseId: payment.responseId }
        : { bookingId: payment.bookingId || payment.id };

      const res = await paymentService.initializePaystack(params, coversFees);

      if (res.success && res.redirect_url && !res.authorization_url) {
        // R0 insurance — no Paystack payment, booking confirmed directly
        window.location.href = res.redirect_url;
      } else if (res.success && res.authorization_url) {
        if (!isPaystackUrl(res.authorization_url)) {
          throw new Error("Invalid payment redirect URL.");
        }
        window.location.href = res.authorization_url;
      } else {
        throw new Error(res.message || "Failed to initialize payment");
      }
    } catch (error) {
      import.meta.env.DEV && console.error("Payment Error:", error);
      setLoading(false);
      setErrors({
        general:
          error.message || "Payment initialization failed. Please try again.",
      });
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrors({});
    onClose();
  };

  const hasVat = payment.breakdown?.vat > 0 && (payment.breakdown?.vatPercentage || 0) > 0;
  const initials = payment.providerInitials || "P";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          tabIndex={-1}
          className="relative w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading overlay — shown while initializing Paystack (can take 10-40s) */}
          {loading && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-t-2xl sm:rounded-2xl"
              role="status"
              aria-live="polite"
            >
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-[3px] border-blue-100 dark:border-blue-900/40" />
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-600 dark:border-t-blue-500 animate-spin" />
              </div>
              <div className="text-center px-6">
                <div className="text-[1rem] font-bold text-slate-900 dark:text-white mb-1">
                  Redirecting to secure payment…
                </div>
                <div className="text-[0.8125rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                  This can take up to 30 seconds. Please don't close this window or press back.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-400">
                <Lock size={11} />
                <span>Secured by Paystack</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 id="payment-modal-title" className="text-[1.25rem] font-bold text-slate-900 dark:text-white">
                {isInsuranceR0
                  ? "Confirm Insurance Booking"
                  : partialActive
                    ? `Accept & Pay Deposit (${partialConfig.depositPercentage}%)`
                    : "Accept & Pay in Full"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isInsuranceR0
                  ? "Your insurer covers the full cost — no payment needed"
                  : partialActive
                    ? `Pay ${partialConfig.depositPercentage}% now, ${partialConfig.balancePercentage}% at completion`
                    : "Lock in this quote with full payment"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Quote Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
              {/* Provider row */}
              {payment.providerName && (
                <div className="flex items-center gap-3.5 mb-3.5">
                  {payment.providerAvatar ? (
                    <img
                      src={payment.providerAvatar}
                      alt={payment.providerName}
                      className="w-[42px] h-[42px] rounded-xl object-cover flex-shrink-0"
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    />
                  ) : null}
                  <div
                    className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-white font-extrabold text-[0.9375rem] flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${payment.providerColor || "#2563EB"}, ${payment.providerColor ? payment.providerColor + "CC" : "#1E40AF"})`,
                      display: payment.providerAvatar ? "none" : "flex",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {payment.providerName}
                    </div>
                    <div className="text-[0.8125rem] text-slate-500 truncate">
                      {payment.service}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[0.6875rem] font-semibold flex-shrink-0 ml-auto">
                    <Check size={10} /> Verified
                  </span>
                </div>
              )}

              {/* Vehicle + Reg row */}
              {payment.vehicle && (
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3.5 pb-3.5 border-b border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white">{typeof payment.vehicle === "object" ? `${payment.vehicle.year || ""} ${payment.vehicle.make || ""} ${payment.vehicle.model || ""}`.trim() : payment.vehicle}</strong>
                  {payment.registrationNumber && (
                    <>
                      {" · "}
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold tracking-wide">
                        {payment.registrationNumber}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Insurance breakdown */}
              {payment.isInsuranceRegistered && payment.insuranceBreakdown && (
                <div className="space-y-1.5 mb-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 py-0.5">
                    <span>Total Job Value</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(payment.insuranceBreakdown.totalJobValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 py-0.5">
                    <span>Insurer Covers</span>
                    <span className="font-medium">
                      -{formatCurrency(payment.insuranceBreakdown.insurerCovers)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5">
                    <span className="font-semibold text-slate-900 dark:text-white">Your Excess</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(payment.insuranceBreakdown.customerExcess)}
                    </span>
                  </div>
                  {payment.insuranceBreakdown.customerExcess === 0 && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5">
                      Fully covered by insurer — no payment required
                    </div>
                  )}
                </div>
              )}

              {/* Line items */}
              {payment.breakdown?.parts != null && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 py-0.5">
                  <span>Parts & materials</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(payment.breakdown.parts)}
                  </span>
                </div>
              )}

              {payment.breakdown?.labour != null && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 py-0.5">
                  <span>Labour</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(payment.breakdown.labour)}
                  </span>
                </div>
              )}

              {/* Subtotal — show when no parts/labour breakdown */}
              {payment.breakdown?.parts == null && payment.breakdown?.labour == null && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 py-0.5">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(
                      hasVat
                        ? payment.breakdown?.subtotal || payment.amount
                        : payment.amount,
                    )}
                  </span>
                </div>
              )}

              {/* VAT */}
              {hasVat && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 py-0.5">
                  <span>VAT ({payment.breakdown.vatPercentage}%)</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {payment.breakdown.vatIncluded ? "Included" : formatCurrency(payment.breakdown.vat)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-1.5 font-bold text-slate-900 dark:text-white">
                <span>Total</span>
                <span className="text-xl">{formatCurrency(payment.amount)}</span>
              </div>

              {/* Partial Payment breakdown (Points 1-2, April 2026) */}
              {partialActive && (
                <div className="mt-3 pt-3 border-t border-dashed border-slate-300 dark:border-slate-600 space-y-2">
                  <div className="flex justify-between text-sm py-0.5">
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      Pay Now ({partialConfig.depositPercentage}% deposit)
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(depositAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-0.5">
                    <span className="text-slate-600 dark:text-slate-400">
                      Balance due at completion ({partialConfig.balancePercentage}%)
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(balanceAmount)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">
                    Only the {partialConfig.depositPercentage}% deposit is charged today. The {partialConfig.balancePercentage}% balance is collected when the service is complete.
                  </div>
                </div>
              )}
            </div>

            {/* Full Payment Note — only shown when cancellation policy is active */}
            {policyText && (
              <div className="flex gap-3 items-start bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <CreditCard size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[0.9375rem] font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Cancellation Policy
                  </div>
                  <div className="text-[0.8125rem] text-blue-700 dark:text-blue-400 leading-relaxed">
                    {policyText}
                  </div>
                </div>
              </div>
            )}

            {/* Payment method */}
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Payment method
              </div>
              <div
                className="border-[1.5px] border-blue-600 dark:border-blue-500 rounded-xl p-3.5 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20"
                style={{ boxShadow: "0 0 0 3px rgba(37,99,235,.1)" }}
              >
                <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0066CC", color: "#fff", fontSize: ".45rem", fontWeight: 800, letterSpacing: "-.01em", textAlign: "center", lineHeight: 1.2 }}
                >
                  PAY<br />STACK
                </div>
                <div className="flex-1">
                  <div className="text-[0.9375rem] font-semibold text-slate-800 dark:text-white">
                    Paystack — Card Payment
                  </div>
                  <div className="text-[0.6875rem] text-slate-500">
                    Visa · Mastercard · Debit card
                  </div>
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <div className="rounded px-1.5 py-0.5 text-white font-extrabold" style={{ background: "#1A1F71", fontSize: ".5rem", letterSpacing: ".02em" }}>
                    VISA
                  </div>
                  <div className="rounded flex items-center justify-center" style={{ background: "#EB001B", width: 26, height: 17 }}>
                    <div className="relative" style={{ width: 12, height: 12, background: "#FF5F00", borderRadius: "50%" }}>
                      <div className="absolute" style={{ left: -4, top: 0, width: 12, height: 12, background: "#EB001B", borderRadius: "50%", opacity: 0.85 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {errors.general && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="flex-shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Security footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-1">
              <Lock size={13} />
              <span>Secured by Paystack · PCI-DSS Compliant</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-3 rounded-2xl text-[0.9375rem] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "linear-gradient(135deg, #93C5FD, #60A5FA)"
                  : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                boxShadow: "0 4px 6px -1px rgba(37,99,235,.25)",
              }}
            >
              {loading ? (
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                <>
                  <CreditCard size={18} />
                  {isInsuranceR0
                    ? "Confirm Booking"
                    : partialActive
                      ? `Pay Deposit ${formatCurrency(depositAmount)}`
                      : `Pay ${formatCurrency(payment.amount)}`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
