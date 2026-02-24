import { useState, useEffect } from "react";
import { CreditCard, Zap, Lock, AlertCircle } from "lucide-react";
import Modal, { ModalActions } from "../ui/Modal";
import Button from "../ui/Button";
import useDashboardStore, {
  formatCurrency,
} from "../../store/useDashboardStore";
import paymentService from "../../services/paymentService";

const PaymentModal = ({ payment, isOpen, onClose, onSuccess }) => {
  const { addToast } = useDashboardStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!payment || !isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      const targetBookingId = payment.bookingId || payment.id;

      // 1. Initialize Paystack Transaction on backend
      const res = await paymentService.initializePaystack(targetBookingId);

      if (res.success && res.authorization_url) {
        // 2. Redirect to Paystack Checkout
        // We use window.location.href because dynamic splits are more reliable
        // when handled via the full checkout page.
        window.location.href = res.authorization_url;
      } else {
        throw new Error(res.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment Error:", error);
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
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Service Amount
              </span>
              <span className="text-slate-900 dark:text-white font-medium">
                {formatCurrency(payment.breakdown.service)}
              </span>
            </div>
            {payment.breakdown.callout > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Callout Fee
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {formatCurrency(payment.breakdown.callout)}
                </span>
              </div>
            )}
            {payment.breakdown.materials > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Materials
                </span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {formatCurrency(payment.breakdown.materials)}
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Total Payable
                </span>
                <span className="font-bold text-primary-600 dark:text-primary-400 text-2xl">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            </div>
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
