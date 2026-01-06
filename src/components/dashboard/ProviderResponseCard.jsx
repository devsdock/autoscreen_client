import { Star, BadgeCheck, Building2, User, MessageSquare, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../store/useDashboardStore';
import Button from '../ui/Button';

const ProviderResponseCard = ({ 
  response, 
  onAccept, 
  onMessage, 
  isAccepted = false,
  isRejected = false,
  disabled = false 
}) => {
  const { provider, responseType, price, etaText, message, status } = response;
  
  return (
    <div className={`
      bg-white dark:bg-slate-800 rounded-xl border p-5 transition-all
      ${isAccepted 
        ? 'border-success-500 dark:border-success-600 ring-2 ring-success-500/20' 
        : isRejected 
          ? 'border-slate-200 dark:border-slate-700 opacity-60' 
          : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
      }
    `}>
      {/* Provider Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {(provider.name || 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {provider.name || 'Provider'}
              </h4>
              {provider.type === 'Business' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                  <Building2 size={10} />
                  Business
                </span>
              )}
              {provider.type === 'Individual' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">
                  <User size={10} />
                  Individual
                </span>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-warning-500 fill-warning-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {(provider.rating || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({provider.reviewsCount} reviews)
              </span>
            </div>
          </div>
        </div>
        
        {/* Response Type Badge */}
        {responseType === 'Counter' && (
          <span className="px-2 py-1 bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 text-xs font-medium rounded-full">
            Counter Offer
          </span>
        )}
        
        {/* Accepted/Rejected Badge */}
        {isAccepted && (
          <span className="px-2 py-1 bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 text-xs font-medium rounded-full flex items-center gap-1">
            <BadgeCheck size={12} />
            Accepted
          </span>
        )}
        {isRejected && (
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full">
            Not Selected
          </span>
        )}
      </div>
      
      {/* Price & ETA */}
      <div className="flex items-end justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Quoted Price</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(price || 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Availability</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {etaText}
          </p>
        </div>
      </div>
      
      {/* Message */}
      {message && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
            "{message}"
          </p>
        </div>
      )}
      
      {/* Service Area */}
      {(provider.serviceAreas?.length > 0 || provider.serviceArea || provider.address?.city) && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Service area: {
            Array.isArray(provider.serviceAreas) 
              ? provider.serviceAreas.join(', ') 
              : (provider.serviceArea || provider.address?.city)
          }
        </p>
      )}
      
      {/* Actions */}
      {!isAccepted && !isRejected && !disabled && (
        <div className="flex items-center gap-3">
          <Button 
            onClick={onAccept}
            className="flex-1"
          >
            Accept Quote
          </Button>
          <Button 
            variant="secondary"
            onClick={onMessage}
            className="flex-shrink-0"
          >
            <MessageSquare size={16} />
          </Button>
        </div>
      )}
      
      {isAccepted && (
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary"
            onClick={onMessage}
            className="flex-1"
          >
            <MessageSquare size={16} />
            Message Provider
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProviderResponseCard;



