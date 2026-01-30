import { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  Zap,
  Lock,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Modal, { ModalActions } from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import useDashboardStore, {
  formatCurrency,
} from "../../store/useDashboardStore";
import paymentService from "../../services/paymentService";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentModalContent = ({ payment, isOpen, onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { processPayment, addToast, user } = useDashboardStore();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!payment) return null;

  const handleSubmit = async () => {
    if (!paymentMethod) {
      setErrors({ general: "Please select a payment method" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const targetBookingId = payment.bookingId || payment.id;
      let methodLabel = paymentMethod === "cash" ? "Cash" : paymentMethod;

      if (paymentMethod === "card") {
        if (!stripe || !elements) {
          setLoading(false);
          return;
        }

        // 1. Create Payment Intent on backend
        const intentRes =
          await paymentService.createPaymentIntent(targetBookingId);
        if (!intentRes.success) {
          throw new Error(intentRes.message || "Failed to initialize payment");
        }

        const clientSecret = intentRes.clientSecret;

        // 2. Confirm Payment with Stripe
        const cardElement = elements.getElement(CardElement);
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.name || payment.customerName || "Customer",
            },
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        if (result.paymentIntent.status === "succeeded") {
          methodLabel = `Card •••• ${result.paymentIntent.payment_method?.card?.last4 || "Card"}`;
        } else {
          throw new Error("Payment was not successful. Please try again.");
        }
      }

      // 3. Finalize Booking Status on Backend
      const bookingService = (await import("../../services/bookingService"))
        .default;
      await bookingService.processBookingPayment(targetBookingId, {
        paymentMethod: methodLabel,
        amount: payment.amount,
        paymentId: payment.id,
        transactionId:
          paymentMethod === "card" ? result?.paymentIntent?.id : null,
      });

      // Update Local Store
      processPayment(payment.id, methodLabel);

      setLoading(false);
      addToast({ type: "success", message: "Payment processed successfully!" });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Payment Error:", error);
      setLoading(false);
      setErrors({
        general:
          error.message || "Payment processing failed. Please try again.",
      });
    }
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setErrors({});
    onClose();
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1e293b",
        "::placeholder": {
          color: "#94a3b8",
        },
      },
      invalid: {
        color: "#ef4444",
      },
    },
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
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Card Details
              </label>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                <CardElement options={cardElementOptions} />
              </div>
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
          {paymentMethod === "cash"
            ? "Confirm Booking"
            : `Pay ${formatCurrency(payment.amount)}`}
        </Button>
      </ModalActions>
    </Modal>
  );
};

const PaymentModal = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentModalContent {...props} />
    </Elements>
  );
};

export default PaymentModal;
