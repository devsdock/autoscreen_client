import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
};

const Toast = ({ id, type = 'info', message, title }) => {
  const { removeToast } = useDashboardStore();
  const Icon = toastIcons[type];
  
  return (
    <div 
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        toast-enter
        ${toastStyles[type]}
      `}
      role="alert"
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconStyles[type]}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm">{title}</p>
        )}
        <p className={`text-sm ${title ? 'mt-0.5' : ''}`}>{message}</p>
      </div>
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useDashboardStore();
  
  if (toasts.length === 0) return null;
  
  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
export default ToastContainer;




