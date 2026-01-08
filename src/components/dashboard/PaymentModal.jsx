import { useState } from "react";
import {
  CreditCard,
  Building2,
  Zap,
  Lock,
  Banknote,
  AlertCircle,
} from "lucide-react";
import Modal, { ModalActions } from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import useDashboardStore, {
  formatCurrency,
} from "../../store/useDashboardStore";
import {
  formatCardNumber,
  formatExpiry,
  formatCVV,
  validateCardForm,
} from "../../utils/paymentValidation";

const PaymentModal = ({ payment, isOpen, onClose, onSuccess }) => {
  const { processPayment } = useDashboardStore();
  const [paymentMethod, setPaymentMethod] = useState(null); // Start with null - force selection
  const [instantProvider, setInstantProvider] = useState("PayFast");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  if (!payment) return null;

  const handleCardChange = (field, value) => {
    let formattedValue = value;

    if (field === "number") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvv") {
      formattedValue = formatCVV(value);
    }

    setCardDetails((prev) => ({ ...prev, [field]: formattedValue }));

    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async () => {
    // Validate payment method is selected
    if (!paymentMethod) {
      setErrors({ general: "Please select a payment method" });
      return;
    }

    // Validate card details if card payment is selected
    if (paymentMethod === "card") {
      const validation = validateCardForm(cardDetails);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
    }

    setLoading(true);
    setErrors({});

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let methodLabel = paymentMethod;
    if (paymentMethod === "card") {
      methodLabel = `Card •••• ${cardDetails.number
        .replace(/\s/g, "")
        .slice(-4)}`;
    } else if (paymentMethod === "instant") {
      methodLabel = `Instant EFT (${instantProvider})`;
    }

    // DIRECT API CALL to ensure server persistence
    try {
      const bookingService = (await import("../../services/bookingService"))
        .default;
      const targetBookingId = payment.bookingId || payment.id;

      if (targetBookingId) {
        await bookingService.processBookingPayment(targetBookingId, {
          paymentMethod: methodLabel,
          amount: payment.amount,
          paymentId: payment.bookingId ? payment.id : undefined,
        });
      }

      // Update Local Store (Optimistic)
      processPayment(payment.id, methodLabel);

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Payment API Error:", error);
      setLoading(false);
      setErrors({
        general:
          error.response?.data?.message ||
          "Payment processing failed. Please try again.",
      });
    }
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setCardDetails({ number: "", expiry: "", cvv: "", name: "" });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Payment"
      description={`Pay ${formatCurrency(payment.amount)} for ${
        payment.service
      }`}
      size="md"
    >
      <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto pr-2">
        {/* Amount Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Service Amount
            </span>
            <span className="text-slate-900 dark:text-white">
              {formatCurrency(payment.breakdown.service)}
            </span>
          </div>
          {payment.breakdown.callout > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Callout Fee
              </span>
              <span className="text-slate-900 dark:text-white">
                {formatCurrency(payment.breakdown.callout)}
              </span>
            </div>
          )}
          {payment.breakdown.materials > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Materials
              </span>
              <span className="text-slate-900 dark:text-white">
                {formatCurrency(payment.breakdown.materials)}
              </span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                Total
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-lg">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Payment Method <span className="text-red-500">*</span>
            </label>
            {errors.general && (
              <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.general}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {[
              { id: "card", label: "Credit/Debit Card", icon: CreditCard },
              { id: "eft", label: "EFT Bank Transfer", icon: Building2 },
              { id: "instant", label: "Instant EFT", icon: Zap },
              { id: "cash", label: "Cash Payment", icon: Banknote },
            ].map((method) => {
              const isActive = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method.id);
                    if (errors.general) {
                      setErrors((prev) => ({ ...prev, general: null }));
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <method.icon
                    size={20}
                    className={
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-400"
                    }
                  />
                  <span
                    className={`font-medium ${
                      isActive
                        ? "text-primary-700 dark:text-primary-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {method.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Method Actions / Details */}
        <div className="animate-in fade-in duration-200">
          {paymentMethod === "card" && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <Input
                label={
                  <>
                    Card Number <span className="text-red-500">*</span>
                  </>
                }
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => handleCardChange("number", e.target.value)}
                icon={CreditCard}
                error={errors.number}
                className={`bg-white dark:bg-slate-900 ${
                  errors.number ? "border-red-500" : ""
                }`}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={
                    <>
                      Expiry Date <span className="text-red-500">*</span>
                    </>
                  }
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => handleCardChange("expiry", e.target.value)}
                  error={errors.expiry}
                  className={`bg-white dark:bg-slate-900 ${
                    errors.expiry ? "border-red-500" : ""
                  }`}
                />
                <Input
                  label={
                    <>
                      CVV <span className="text-red-500">*</span>
                    </>
                  }
                  placeholder="123"
                  type="password"
                  value={cardDetails.cvv}
                  onChange={(e) => handleCardChange("cvv", e.target.value)}
                  error={errors.cvv}
                  className={`bg-white dark:bg-slate-900 ${
                    errors.cvv ? "border-red-500" : ""
                  }`}
                />
              </div>
              <Input
                label={
                  <>
                    Cardholder Name <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Name on card"
                value={cardDetails.name}
                onChange={(e) => handleCardChange("name", e.target.value)}
                error={errors.name}
                className={`bg-white dark:bg-slate-900 ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
            </div>
          )}

          {paymentMethod === "eft" && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Bank Details
              </p>
              <div className="space-y-2 text-sm bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">
                    Bank
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    First National Bank
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">
                    Account Name
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    AutoScreen (Pty) Ltd
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">
                    Account Number
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium font-mono">
                    62845912345
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">
                    Branch Code
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium font-mono">
                    250655
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-500">
                    Reference
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium font-mono">
                    {payment.bookingRef || payment.id?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                Please use your Booking Ref or Payment ID. EFT payments may take
                1-3 days.
              </p>
            </div>
          )}

          {paymentMethod === "instant" && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
              {["PayFast", "Ozow"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setInstantProvider(provider)}
                  className={`p-3 border-2 rounded-lg transition-all text-center ${
                    instantProvider === provider
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-700"
                  }`}
                >
                  <div
                    className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                      instantProvider === provider
                        ? "bg-white dark:bg-slate-800"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`font-bold ${
                        instantProvider === provider
                          ? "text-primary-600"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {provider === "PayFast" ? "PF" : "OZ"}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      instantProvider === provider
                        ? "text-primary-700 dark:text-primary-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {provider}
                  </span>
                </button>
              ))}
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Please pay the provider directly upon service completion.
                Clicking "Pay" will confirm your booking.
              </p>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock size={14} />
          <span>Your payment is secured with 256-bit encryption</span>
        </div>
      </div>

      <ModalActions>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!paymentMethod || loading}
        >
          {paymentMethod === "eft"
            ? "Mark as Paid (Simulation)"
            : `Pay ${formatCurrency(payment.amount)}`}
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default PaymentModal;
