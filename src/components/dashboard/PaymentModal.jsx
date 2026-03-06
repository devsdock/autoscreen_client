import { useState, useEffect } from "react";
import { CreditCard, Zap, Lock, AlertCircle } from "lucide-react";
import Modal, { ModalActions } from "../ui/Modal";
import Button from "../ui/Button";
import useDashboardStore, {
  formatCurrency,
} from "../../store/useDashboardStore";
import paymentService from "../../services/paymentService";

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

  // Fetch fee rate from backend
  useEffect(() => {
    paymentService
      .getPaystackConfig()
      .then((res) => {
        if (res.success && res.variableFeeRate) setVariableFeeRate(res.variableFeeRate);
      })
      .catch(() => {});
  }, []);

  // Calculate surcharge using fetched fee rate
  useEffect(() => {
    if (coversFees && payment?.amount) {
      const calculatedSurcharge =
        payment.amount / (1 - variableFeeRate) - payment.amount;
      setSurcharge(Math.round(calculatedSurcharge * 100) / 100);
    } else {
      setSurcharge(0);
    }
  }, [coversFees, payment?.amount, variableFeeRate]);

  if (!payment || !isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      const targetBookingId = payment.bookingId || payment.id;

      // 1. Initialize Paystack Transaction on backend
      const res = await paymentService.initializePaystack(
        targetBookingId,
        coversFees,
      );

      if (res.success && res.authorization_url) {
        // Validate redirect URL before navigating
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
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Payment"
      description={`Secure card payment for ${payment.service}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Amount Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700/50 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
            <span className="text-slate-900 dark:text-white font-medium">
              {formatCurrency(
                (payment.breakdown?.vatPercentage || 0) > 0
                  ? payment.breakdown?.subtotal || payment.amount
                  : payment.amount,
              )}
            </span>
          </div>

          {payment.breakdown?.vat > 0 &&
            (payment.breakdown?.vatPercentage || 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  VAT ({payment.breakdown?.vatPercentage || 0}%)
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {formatCurrency(payment.breakdown.vat)}
                </span>
              </div>
            )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-900 dark:text-white font-bold">
              Total Amount
            </span>
            <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
              {formatCurrency(payment.amount)}
            </span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="space-y-4">
          <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <CreditCard
                className="text-primary-600 dark:text-primary-400"
                size={20}
              />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Secure Card Payment
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                You will be redirected to Paystack's secure checkout to complete
                your payment via Credit/Debit card.
              </p>
            </div>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              {errors.general}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2">
          <Lock size={14} />
          <span>Secured by Paystack • PCI-DSS Compliant</span>
        </div>
      </div>

      <ModalActions>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
          className="px-8 bg-primary-600 hover:bg-primary-700 text-white"
        >
          Proceed to Pay {formatCurrency(payment.amount)}
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default PaymentModal;
