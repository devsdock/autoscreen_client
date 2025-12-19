import { Check, Clock, AlertCircle, X, CreditCard, FileText, Calendar } from 'lucide-react';

// Status configurations
const bookingStatusConfig = {
  Pending: { 
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Pending'
  },
  Accepted: { 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Check,
    label: 'Accepted'
  },
  Confirmed: { 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: Check,
    label: 'Confirmed'
  },
  Completed: { 
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Check,
    label: 'Completed'
  },
  Cancelled: { 
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: X,
    label: 'Cancelled'
  }
};

const paymentStatusConfig = {
  Unpaid: { 
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertCircle,
    label: 'Unpaid'
  },
  Pending: { 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
    label: 'Processing'
  },
  Paid: { 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: Check,
    label: 'Paid'
  },
  Refunded: { 
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: CreditCard,
    label: 'Refunded'
  }
};

const quoteStatusConfig = {
  Open: { 
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: FileText,
    label: 'Open'
  },
  Responses: { 
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: AlertCircle,
    label: 'Responses'
  },
  'Received Responses': { 
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: AlertCircle,
    label: 'Responses'
  },
  Accepted: { 
    color: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: Check,
    label: 'Accepted'
  },
  Expired: { 
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: Clock,
    label: 'Expired'
  },
  Closed: { 
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    icon: X,
    label: 'Closed'
  }
};

const StatusBadge = ({ 
  status, 
  type = 'booking', 
  showIcon = true,
  size = 'sm',
  className = '' 
}) => {
  const configs = {
    booking: bookingStatusConfig,
    payment: paymentStatusConfig,
    quote: quoteStatusConfig
  };
  
  const config = configs[type]?.[status];
  
  if (!config) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 ${className}`}>
        {status}
      </span>
    );
  }
  
  const Icon = config.icon;
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14
  };
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${config.color}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;


