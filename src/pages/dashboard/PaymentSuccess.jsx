import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Banknote,
  Mail,
  Zap,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import paymentService from "../../services/paymentService";
import useDashboardStore, { formatCurrency } from "../../store/useDashboardStore";

/**
 * Shared success page for all commit paths:
 *   - mode=prepayment       — Paystack returns with ?reference=, we verify
 *   - mode=cash             — backend acceptCash already committed
 *   - mode=card_link        — backend acceptCardAfter (payment_link) already committed
 *   - mode=card_tokenized   — Paystack returns after card save
 *   - mode=insurance        — R0 insurance direct commit
 *
 * Optional query params: bookingId, quoteId, reference
 */
const MODE_CONFIG = {
  prepayment: {
    accent: "emerald",
    Icon: CreditCard,
    title: "Payment Successful",
    subtitle: "Your payment is confirmed. Lock in your appointment next.",
    next: { label: "Book Your Appointment", to: (ctx) => quoteBookUrl(ctx) },
  },
  cash: {
    accent: "emerald",
    Icon: Banknote,
    title: "Booking Confirmed",
    subtitle:
      "You'll pay cash to the technician on the day. Please have the exact amount ready.",
    next: { label: "Book Your Appointment", to: (ctx) => quoteBookUrl(ctx) },
  },
  card_link: {
    accent: "amber",
    Icon: Mail,
    title: "Booking Confirmed",
    subtitle:
      "A secure payment link will be emailed to you once your service is complete.",
    next: { label: "Book Your Appointment", to: (ctx) => quoteBookUrl(ctx) },
  },
  card_tokenized: {
    accent: "violet",
    Icon: Zap,
    title: "Card Saved",
    subtitle:
      "Your card is saved securely. We'll charge it automatically once your service is complete.",
    next: { label: "Book Your Appointment", to: (ctx) => quoteBookUrl(ctx) },
  },
  insurance: {
    accent: "emerald",
    Icon: Shield,
    title: "Insurance Booking Confirmed",
    subtitle: "Your insurer covers the full cost — no payment needed.",
    next: { label: "Book Your Appointment", to: (ctx) => quoteBookUrl(ctx) },
  },
};

const quoteBookUrl = ({ quoteId, bookingId }) => {
  if (quoteId) return `/dashboard/quotes/${quoteId}/book-appointment`;
  if (bookingId) return `/dashboard/bookings/${bookingId}`;
  return "/dashboard/quotes";
};

// Accent → tailwind class bundle
const ACCENT = {
  emerald: {
    ringBg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconBg: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
  amber: {
    ringBg: "bg-amber-50 dark:bg-amber-900/20",
    iconBg: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
    text: "text-amber-600 dark:text-amber-400",
    btn: "bg-amber-600 hover:bg-amber-700",
  },
  violet: {
    ringBg: "bg-violet-50 dark:bg-violet-900/20",
    iconBg: "bg-violet-500",
    gradient: "from-violet-500 to-violet-600",
    text: "text-violet-600 dark:text-violet-400",
    btn: "bg-violet-600 hover:bg-violet-700",
  },
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addToast = useDashboardStore((s) => s.addToast);

  const rawMode = searchParams.get("mode") || "prepayment";
  const mode = MODE_CONFIG[rawMode] ? rawMode : "prepayment";
  const config = MODE_CONFIG[mode];

  const bookingId = searchParams.get("bookingId") || "";
  const quoteId = searchParams.get("quoteId") || "";
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";

  // Auto-verify whenever Paystack returned with a reference. Originally
  // limited to prepayment + card_tokenized modes — but Partial Payment
  // (Points 1-2, April 2026) means cash + card_link ALSO go through
  // Paystack first (deposit charge), so they too return with ?reference=
  // and need verification before the user navigates onward. The verify
  // endpoint is idempotent: if the booking is already committed (webhook
  // beat us), it returns it; otherwise it calls processQuoteChargeSuccess
  // to commit. Insurance R0 mode redirects without a reference, so it's
  // unaffected.
  const needsVerify = Boolean(reference);

  const [verifyState, setVerifyState] = useState(
    needsVerify ? "loading" : "idle",
  );
  const [verifyError, setVerifyError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const verifyRanRef = useRef(false);

  useEffect(() => {
    if (!needsVerify || verifyRanRef.current) return;
    verifyRanRef.current = true;

    (async () => {
      try {
        const res = await paymentService.verifyPaystack(reference);
        if (res?.success) {
          setVerifyResult(res);
          setVerifyState("success");
        } else {
          setVerifyError(res?.message || "Payment could not be verified.");
          setVerifyState("error");
          addToast?.({
            type: "error",
            message: res?.message || "Payment verification failed.",
          });
        }
      } catch (err) {
        setVerifyError(
          err?.response?.data?.message ||
            err?.message ||
            "Payment verification failed.",
        );
        setVerifyState("error");
        addToast?.({
          type: "error",
          message: "Could not verify payment. Please contact support.",
        });
      }
    })();
  }, [needsVerify, reference, addToast]);

  const ctx = { bookingId, quoteId };
  const amount = useMemo(() => {
    const qs = searchParams.get("amount");
    if (qs) return Number(qs);
    const apiAmount = verifyResult?.data?.amount;
    return apiAmount ? Number(apiAmount) : null;
  }, [searchParams, verifyResult]);
  const bookingRef =
    verifyResult?.data?.bookingNumber ||
    searchParams.get("bookingNumber") ||
    "";

  const accent = ACCENT[config.accent] || ACCENT.emerald;
  const { Icon } = config;

  // Loading state while Paystack verifies
  if (verifyState === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100 dark:border-emerald-900/40" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-600 animate-spin" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Verifying your payment…
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              This usually takes a few seconds. Please don't close this window.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failure state — Paystack returned something but verification failed
  if (verifyState === "error") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/40 p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Payment not verified
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            {verifyError}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate(quoteId ? `/dashboard/quotes/${quoteId}` : "/dashboard/quotes")}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Back to Quote
            </button>
            <button
              onClick={() => navigate("/dashboard/support")}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[520px]">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Accent hero */}
          <div
            className={`bg-gradient-to-br ${accent.gradient} px-5 pt-6 pb-12 text-center relative`}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2.5">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-0.5">
              {config.title}
            </h1>
            <p className="text-[0.8125rem] text-white/90 max-w-[360px] mx-auto leading-snug">
              {config.subtitle}
            </p>
          </div>

          {/* Overlap check badge */}
          <div className="relative flex justify-center -mt-6">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center">
              <CheckCircle2 className={`w-8 h-8 ${accent.text}`} />
            </div>
          </div>

          {/* Body */}
          <div className="px-5 pt-2 pb-5">
            {/* Info rows */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 mt-1">
              {bookingRef && (
                <Row label="Booking Ref" value={bookingRef} mono />
              )}
              {amount != null && !Number.isNaN(amount) && (
                <Row label="Amount" value={formatCurrency(amount)} />
              )}
              {reference && (
                <Row label="Reference" value={reference} mono small />
              )}
            </div>

            {/* What happens next */}
            <div className="mt-3 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                What happens next
              </div>
              <ul className="space-y-1 text-[0.8125rem] text-slate-700 dark:text-slate-300 leading-snug">
                {NEXT_STEPS[mode].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mt-[0.4rem] shrink-0 ${accent.iconBg}`}
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard/bookings")}
                className="flex-1 px-4 py-2.5 rounded-xl text-[0.8125rem] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                View My Bookings
              </button>
              <button
                type="button"
                onClick={() => navigate(config.next.to(ctx))}
                className={`flex-[2] px-5 py-2.5 rounded-xl text-[0.8125rem] font-bold text-white flex items-center justify-center gap-2 transition ${accent.btn}`}
              >
                {config.next.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NEXT_STEPS = {
  prepayment: [
    "Select a date and time that suits you.",
    "We'll notify your provider once confirmed.",
    "You'll get an email receipt shortly.",
  ],
  cash: [
    "Pick a date and time for the service.",
    "Have the exact cash amount ready on the day.",
    "Your provider will confirm arrival.",
  ],
  card_link: [
    "Pick a date and time for the service.",
    "After your service, we'll email you a secure payment link.",
    "Pay straight from the email — takes under a minute.",
  ],
  card_tokenized: [
    "Pick a date and time for the service.",
    "After your service, your saved card will be charged automatically.",
    "You'll receive a receipt as soon as the charge settles.",
  ],
  insurance: [
    "Pick a date and time for the service.",
    "Your insurer will settle the full amount with the provider.",
    "You'll get an email receipt as proof of booking.",
  ],
};

const Row = ({ label, value, mono = false, small = false }) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
      {label}
    </span>
    <span
      className={`${mono ? "font-mono" : "font-semibold"} ${small ? "text-[0.75rem] truncate max-w-[60%] text-right" : "text-sm"} text-slate-900 dark:text-white`}
      title={typeof value === "string" ? value : undefined}
    >
      {value}
    </span>
  </div>
);

// Silence unused import during lint — Loader2 is reserved for future spinner states.
void Loader2;

export default PaymentSuccess;
