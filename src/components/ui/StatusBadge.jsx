// Status configurations — dot-based badges matching HTML .badge design
// Each status uses a colored dot (::before pseudo equivalent) instead of icons

const bookingStatusConfig = {
  Searching: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Searching",
  },
  searching: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Searching",
  },
  "awaiting-customer-approval": {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Action Required",
  },
  "Action Required": {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Action Required",
  },
  Pending: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Pending",
  },
  pending: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Pending",
  },
  Accepted: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Accepted",
  },
  accepted: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Accepted",
  },
  "Awaiting Payment": {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Awaiting Payment",
  },
  "awaiting-payment": {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Awaiting Payment",
  },
  Confirmed: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Confirmed",
  },
  confirmed: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Confirmed",
  },
  Scheduled: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Scheduled",
  },
  scheduled: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Scheduled",
  },
  rescheduled: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Rescheduled",
  },
  Arrived: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Arrived",
  },
  arrived: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Arrived",
  },
  "In Progress": {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "In Progress",
  },
  "in-progress": {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "In Progress",
  },
  completed: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Completed",
  },
  "completed-by-fitter": {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Completed",
  },
  Cancelled: {
    color:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    dot: "bg-red-600 dark:bg-red-400",
    label: "Cancelled",
  },
  cancelled: {
    color:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    dot: "bg-red-600 dark:bg-red-400",
    label: "Cancelled",
  },
  Rejected: {
    color:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    dot: "bg-red-600 dark:bg-red-400",
    label: "Rejected",
  },
  rejected: {
    color:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    dot: "bg-red-600 dark:bg-red-400",
    label: "Rejected",
  },
  Expired: {
    color:
      "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "Expired",
  },
  expired: {
    color:
      "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "Expired",
  },
  "awaiting-provider-acceptance": {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Awaiting Provider",
  },
  "Awaiting Provider": {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Awaiting Provider",
  },
  // Flexible Payment Options v1.2 — post-payment-model statuses
  "service-done": {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Service Done",
  },
  "payment-pending": {
    color:
      "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
    dot: "bg-violet-700 dark:bg-violet-400",
    label: "Awaiting Payment",
  },
};

const paymentStatusConfig = {
  Unpaid: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Unpaid",
  },
  unpaid: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Unpaid",
  },
  Pending: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Processing",
  },
  pending: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Processing",
  },
  Paid: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Paid",
  },
  paid: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Paid",
  },
  insurance_direct: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Paid",
  },
  Refunded: {
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    dot: "bg-purple-700 dark:bg-purple-400",
    label: "Refunded",
  },
  refunded: {
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    dot: "bg-purple-700 dark:bg-purple-400",
    label: "Refunded",
  },
  partially_refunded: {
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    dot: "bg-purple-700 dark:bg-purple-400",
    label: "Partial Refund",
  },
  "Partial Refund": {
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    dot: "bg-purple-700 dark:bg-purple-400",
    label: "Partial Refund",
  },
  "Partially Refunded": {
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    dot: "bg-purple-700 dark:bg-purple-400",
    label: "Partial Refund",
  },
};

const quoteStatusConfig = {
  Open: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Open",
  },
  Responses: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Responses",
  },
  "Received Responses": {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Responses",
  },
  Accepted: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Accepted",
  },
  Expired: {
    color:
      "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "Expired",
  },
  Closed: {
    color:
      "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "Closed",
  },
  Pending: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Pending",
  },
  pending: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-700 dark:bg-blue-400",
    label: "Open",
  },
  quoted: {
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600 dark:bg-amber-400",
    label: "Quoted",
  },
  accepted: {
    color:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    dot: "bg-green-700 dark:bg-green-400",
    label: "Accepted",
  },
  expired: {
    color:
      "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "Expired",
  },
  cancelled: {
    color:
      "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    dot: "bg-slate-600 dark:bg-slate-400",
    label: "Closed",
  },
};

const StatusBadge = ({
  status,
  type = "booking",
  size = "sm",
  className = "",
}) => {
  const configs = {
    booking: bookingStatusConfig,
    payment: paymentStatusConfig,
    quote: quoteStatusConfig,
  };

  const normalizedStatus = status?.trim()?.toLowerCase();

  const config =
    configs[type]?.[status?.trim()] ||
    configs[type]?.[normalizedStatus] ||
    configs[type]?.[
      Object.keys(configs[type]).find(
        (k) => k.toLowerCase() === normalizedStatus,
      )
    ];

  if (!config) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ${className}`}
      >
        <span className="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0" />
        {status}
      </span>
    );
  }

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-[3px] text-xs",
    md: "px-3 py-1 text-sm",
  };

  const dotSizes = {
    xs: "w-[4px] h-[4px]",
    sm: "w-[5px] h-[5px]",
    md: "w-[6px] h-[6px]",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full
        ${config.color}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className={`${dotSizes[size]} rounded-full ${config.dot} flex-shrink-0`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
