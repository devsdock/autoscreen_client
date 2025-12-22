import { FileText, Calendar, CreditCard, Car, MapPin } from 'lucide-react';
import Button from './Button';

const icons = {
  quotes: FileText,
  bookings: Calendar,
  payments: CreditCard,
  vehicles: Car,
  addresses: MapPin,
  default: FileText
};

const EmptyState = ({
  icon,
  iconType = 'default',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) => {
  const Icon = icon || icons[iconType] || icons.default;
  
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {actionLabel && (
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

