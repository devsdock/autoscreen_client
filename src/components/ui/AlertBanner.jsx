import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import Button from './Button';

const icons = {
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
  info: Info
};

const styles = {
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const iconStyles = {
  warning: 'text-amber-500',
  error: 'text-red-500',
  success: 'text-green-500',
  info: 'text-blue-500'
};

const AlertBanner = ({
  type = 'info',
  title,
  message,
  actionLabel,
  onAction,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const Icon = icons[type];
  
  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 ${styles[type]} ${className}`}>
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconStyles[type]}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm">{title}</p>
        )}
        <p className={`text-sm ${title ? 'mt-0.5' : ''}`}>{message}</p>
        {actionLabel && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onAction}
            className="mt-2 -ml-2 font-semibold"
          >
            {actionLabel} →
          </Button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;




