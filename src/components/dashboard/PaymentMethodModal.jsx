import { useState, useEffect } from "react";
import { CreditCard, Banknote, Shield, Check, ArrowLeft, Zap, Mail, X } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * PaymentMethodModal
 *
 * Pre-payment step that appears when a provider supports more than one
 * payment method (Flexible Payment Options v1.2). Customer picks between
 * prepayment (card now), cash on completion, and card-on-completion
 * (two sub-modes: Add card now / Pay via link later).
 *
 * Commit semantics (April 2026):
 *   - "prepayment"           → opens PaymentModal which has its own Pay confirm button
 *   - "card_after_tokenize"  → Paystack page IS the commit (backend defers
 *                              acceptance to the tokenize webhook)
 *   - "cash"                 → requires an explicit Confirm click here
 *   - "card_after"           → requires an explicit Confirm click here
 *
 * Props:
 *   isOpen           — boolean
 *   onClose          — close handler
 *   onSelect(method) — called with "prepayment" | "cash" | "card_after" | "card_after_tokenize"
 *   providerName     — provider display name
 *   amount           — total amount string or number
 *   paymentOptions   — provider.paymentOptions object
 */
const PaymentMethodModal = ({
  isOpen,
  onClose,
  onSelect,
  providerName,
  amount,
  paymentOptions = { prepayment: true, cashOnCompletion: false, cardOnCompletion: false },
}) => {
  const [view, setView] = useState("main");
  // Tracks a tentative selection that requires explicit Confirm (cash / card_after).
  // Prepayment and card_after_tokenize are committed at click time.
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setView("main");
      setSelectedMethod(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const amountStr =
    typeof amount === "number" ? `R ${amount.toLocaleString("en-US")}` : amount || "";

  const handleMethodClick = (method) => {
    if (method === "card_after") {
      // Opening the sub-view is not a commit — reset any pending selection.
      setView("card_sub");
      setSelectedMethod(null);
      return;
    }
    if (method === "prepayment" || method === "card_after_tokenize") {
      // Prepayment → PaymentModal's Pay button is the confirm.
      // card_after_tokenize → Paystack card-save is the confirm.
      onSelect(method);
      return;
    }
    // Cash or "card_after" (Pay via link) → require explicit Confirm below.
    setSelectedMethod((prev) => (prev === method ? null : method));
  };

  const handleConfirm = () => {
    if (selectedMethod) onSelect(selectedMethod);
  };

  const handleClose = () => {
    setView("main");
    setSelectedMethod(null);
    onClose();
  };

  const confirmLabel =
    selectedMethod === "cash"
      ? "Confirm Cash"
      : selectedMethod === "card_after"
        ? "Confirm Pay Link"
        : "";

  const isCardSubView = view === "card_sub";

  // Helper: ring + check indicator for the tentatively-selected card
  const selectionRing = (isSelected, ringColor) =>
    isSelected
      ? { boxShadow: `0 0 0 2px ${ringColor}, 0 0 0 4px rgba(255,255,255,0.8)` }
      : {};

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl animate-scale-in overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              {isCardSubView && (
                <button
                  onClick={() => {
                    setView("main");
                    setSelectedMethod(null);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-[1.25rem] font-bold text-slate-900 dark:text-white truncate">
                  {isCardSubView ? "Pay by card after service" : "Choose Payment Method"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {isCardSubView
                    ? "Choose how you'd like to set up card payment"
                    : `${providerName} offers multiple ways to pay`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Options */}
          {!isCardSubView && (
          <div className="px-5 py-4 space-y-2.5">
            {/* Prepayment — always first, always available */}
            <button
              onClick={() => handleMethodClick("prepayment")}
              className="w-full text-left p-4 rounded-2xl border-[1.5px] transition-all hover:-translate-y-px group"
              style={{
                borderColor: "#93c5fd",
                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1e40af)" }}
                >
                  <CreditCard className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-bold text-[0.875rem] text-slate-900 dark:text-white">
                      Pay now by card
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[0.625rem] font-bold">
                      <Shield className="w-2.5 h-2.5" /> Recommended
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-slate-600 dark:text-slate-400 leading-snug">
                    Pay securely before your service with full platform protection.
                    {amountStr && (
                      <>
                        {" "}
                        <strong className="text-slate-900 dark:text-white">{amountStr}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </button>

            {/* Cash on Completion — selection only; requires Confirm below */}
            {paymentOptions.cashOnCompletion && (
              <button
                onClick={() => handleMethodClick("cash")}
                className="w-full text-left p-4 rounded-2xl border-[1.5px] transition-all hover:-translate-y-px group relative"
                style={{
                  borderColor: selectedMethod === "cash" ? "#16a34a" : "#bbf7d0",
                  background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                  ...selectionRing(selectedMethod === "cash", "#16a34a"),
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                  >
                    <Banknote className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="font-bold text-[0.875rem] text-slate-900 dark:text-white">
                        Pay cash when done
                      </span>
                      {selectedMethod === "cash" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[0.625rem] font-bold">
                          <Check className="w-2.5 h-2.5" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[0.75rem] text-slate-600 dark:text-slate-400 leading-snug">
                      Pay your technician directly in cash after service.
                      {amountStr && (
                        <>
                          {" "}
                          Have <strong className="text-slate-900 dark:text-white">{amountStr}</strong>{" "}
                          ready.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* Card on Completion — opens sub-view with Add-card-now vs Pay-via-link */}
            {paymentOptions.cardOnCompletion && (
              <button
                onClick={() => handleMethodClick("card_after")}
                className="w-full text-left p-4 rounded-2xl border-[1.5px] transition-all hover:-translate-y-px group"
                style={{
                  borderColor: "#fde68a",
                  background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                  >
                    <CreditCard className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[0.875rem] text-slate-900 dark:text-white mb-0.5">
                      Pay by card after service
                    </div>
                    <p className="text-[0.75rem] text-slate-600 dark:text-slate-400 leading-snug">
                      You'll receive a secure payment link by email once your
                      service is complete.
                      {amountStr && (
                        <>
                          {" "}
                          <strong className="text-slate-900 dark:text-white">
                            {amountStr}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
          )}

          {/* Card sub-selection: Add card now (tokenize) vs Pay via link later (Path B) */}
          {isCardSubView && (
            <div className="px-5 py-4 space-y-2.5">
              {/* Add card now — Paystack card-save is the commit, so click immediately */}
              <button
                onClick={() => handleMethodClick("card_after_tokenize")}
                className="w-full text-left p-4 rounded-2xl border-[1.5px] transition-all hover:-translate-y-px group"
                style={{
                  borderColor: "#c4b5fd",
                  background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
                  >
                    <Zap className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="font-bold text-[0.875rem] text-slate-900 dark:text-white">
                        Add card now
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-600 text-white text-[0.625rem] font-bold">
                        <Check className="w-2.5 h-2.5" /> Auto-charge
                      </span>
                    </div>
                    <p className="text-[0.75rem] text-slate-600 dark:text-slate-400 leading-snug">
                      Save your card securely (R1 charge, refunded instantly). We'll
                      automatically charge{" "}
                      {amountStr && (
                        <strong className="text-slate-900 dark:text-white">{amountStr}</strong>
                      )}{" "}
                      after your service is complete — nothing more to do.
                      <span className="block mt-1 text-[0.6875rem] text-slate-500 dark:text-slate-400">
                        Your quote is only accepted once the card is saved.
                      </span>
                    </p>
                  </div>
                </div>
              </button>

              {/* Pay via link later — selection only; requires Confirm below */}
              <button
                onClick={() => handleMethodClick("card_after")}
                className="w-full text-left p-4 rounded-2xl border-[1.5px] transition-all hover:-translate-y-px group relative"
                style={{
                  borderColor: selectedMethod === "card_after" ? "#b45309" : "#fde68a",
                  background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                  ...selectionRing(selectedMethod === "card_after", "#b45309"),
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                  >
                    <Mail className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="font-bold text-[0.875rem] text-slate-900 dark:text-white">
                        Pay via link later
                      </span>
                      {selectedMethod === "card_after" && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-700 text-white text-[0.625rem] font-bold">
                          <Check className="w-2.5 h-2.5" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[0.75rem] text-slate-600 dark:text-slate-400 leading-snug">
                      We'll email you a secure payment link the moment your
                      service is complete. Pay{" "}
                      {amountStr && (
                        <strong className="text-slate-900 dark:text-white">{amountStr}</strong>
                      )}{" "}
                      straight from the email — takes under a minute.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 flex-wrap">
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border-[1.5px] border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-[0.8125rem] whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            {selectedMethod && confirmLabel && (
              <button
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] border-[1.5px] font-semibold text-[0.8125rem] text-white whitespace-nowrap transition-all hover:-translate-y-px"
                style={{
                  borderColor: selectedMethod === "cash" ? "#16a34a" : "#b45309",
                  background:
                    selectedMethod === "cash"
                      ? "linear-gradient(135deg, #16a34a, #15803d)"
                      : "linear-gradient(135deg, #d97706, #b45309)",
                }}
              >
                <Check className="w-3.5 h-3.5" />
                {confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PaymentMethodModal;
