import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Wrench, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import useDashboardStore, { formatDate, formatCurrency } from '../../store/useDashboardStore';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import ProviderResponseCard from './ProviderResponseCard';
import Modal from '../ui/Modal';

const QuoteDetailPanel = ({ quote, onClose }) => {
  const navigate = useNavigate();
  const { quoteResponses, acceptQuote, closeQuoteRequest, addToast } = useDashboardStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [acceptModal, setAcceptModal] = useState({ open: false, response: null });
  const [isAccepting, setIsAccepting] = useState(false);
  
  if (!quote) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Select a quote to view details</p>
        </div>
      </div>
    );
  }
  
  const responses = quoteResponses.filter(r => r.quoteRequestId === quote.id);
  const isAccepted = quote.status === 'Accepted';
  const isClosed = quote.status === 'Closed';
  
  const handleAcceptQuote = async () => {
    if (!acceptModal.response) return;
    
    setIsAccepting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const bookingId = acceptQuote(quote.id, acceptModal.response.id);
    
    setIsAccepting(false);
    setAcceptModal({ open: false, response: null });
    
    // Show success message
    addToast({ 
      type: 'success', 
      message: 'Quote accepted! Booking created successfully.' 
    });
  };
  
  const handleCloseRequest = () => {
    closeQuoteRequest(quote.id);
  };
  
  const handleMessageProvider = () => {
    addToast({ type: 'info', message: 'Messaging feature coming soon!' });
  };
  
  const getStatusExplanation = () => {
    switch (quote.status) {
      case 'Open':
        return 'Your quote request is live. Providers in your area will start responding soon.';
      case 'Responses':
        return 'Providers have responded! Review the offers below and accept one to proceed.';
      case 'Accepted':
        return 'You\'ve accepted a quote. A booking has been created for you.';
      case 'Closed':
        return 'This quote request has been closed.';
      default:
        return '';
    }
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Quote Reference</p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{quote.reference}</h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={quote.status} type="quote" />
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Status Explanation */}
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          quote.status === 'Open' ? 'bg-primary-50 dark:bg-primary-900/20' :
          quote.status === 'Responses' ? 'bg-warning-50 dark:bg-warning-900/20' :
          quote.status === 'Accepted' ? 'bg-success-50 dark:bg-success-900/20' :
          'bg-slate-50 dark:bg-slate-800'
        }`}>
          {quote.status === 'Open' && <Clock size={20} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />}
          {quote.status === 'Responses' && <AlertCircle size={20} className="text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />}
          {quote.status === 'Accepted' && <CheckCircle2 size={20} className="text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />}
          {quote.status === 'Closed' && <X size={20} className="text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />}
          <p className={`text-sm ${
            quote.status === 'Open' ? 'text-primary-700 dark:text-primary-300' :
            quote.status === 'Responses' ? 'text-warning-700 dark:text-warning-300' :
            quote.status === 'Accepted' ? 'text-success-700 dark:text-success-300' :
            'text-slate-600 dark:text-slate-400'
          }`}>
            {getStatusExplanation()}
          </p>
        </div>
        
        {/* Next Step Banner for Accepted */}
        {isAccepted && (
          <div className="p-4 bg-primary-600 dark:bg-primary-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Next Step</p>
                <p className="text-white font-semibold">Complete your booking</p>
              </div>
              <Button
                variant="secondary"
                className="bg-white hover:bg-slate-100 text-primary-600"
                onClick={() => navigate('/dashboard/bookings')}
              >
                View Booking
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
        
        {/* Quote Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Quote Details</h3>
          
          {/* Vehicle */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Car size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}
              </p>
            </div>
          </div>
          
          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Wrench size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Service</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {quote.glassType} - {quote.serviceType}
              </p>
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {quote.location.addressLine1 ? `${quote.location.addressLine1}, ` : ''}{quote.location.city}
                {quote.location.postcode && `, ${quote.location.postcode}`}
              </p>
            </div>
          </div>
          
          {/* Preferred Date */}
          {quote.preferredDate && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Preferred Date & Time</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(quote.preferredDate)} · {quote.preferredTimeSlot || 'Any time'}
                </p>
              </div>
            </div>
          )}
          
          {/* Notes */}
          {quote.notes && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Additional Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{quote.notes}</p>
            </div>
          )}
        </div>
        
        {/* Uploaded Images */}
        {quote.images && quote.images.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              <ImageIcon size={16} className="inline mr-2" />
              Photos ({quote.images.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {quote.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                >
                  <img src={img} alt={`Damage ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Provider Responses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Provider Responses {responses.length > 0 && `(${responses.length})`}
            </h3>
          </div>
          
          {responses.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Clock size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Waiting for provider responses
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Most quotes receive responses within 2-4 hours
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map(response => (
                <ProviderResponseCard
                  key={response.id}
                  response={response}
                  isAccepted={response.status === 'Accepted'}
                  isRejected={response.status === 'Rejected'}
                  disabled={isAccepted || isClosed}
                  onAccept={() => setAcceptModal({ open: true, response })}
                  onMessage={handleMessageProvider}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Close Request Action */}
        {quote.status === 'Open' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button 
              variant="ghost" 
              className="text-slate-500 hover:text-danger-600"
              onClick={handleCloseRequest}
            >
              Close this quote request
            </Button>
          </div>
        )}
        
        {/* Request Date */}
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Requested on {formatDate(quote.createdAt, 'long')}
        </p>
      </div>
      
      {/* Accept Quote Modal */}
      <Modal
        isOpen={acceptModal.open}
        onClose={() => setAcceptModal({ open: false, response: null })}
        title="Accept this quote?"
        size="sm"
      >
        {acceptModal.response && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              You're about to accept the quote from <strong className="text-slate-900 dark:text-white">{acceptModal.response.provider.name}</strong> for{' '}
              <strong className="text-slate-900 dark:text-white">{formatCurrency(acceptModal.response.price)}</strong>.
            </p>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                After accepting:
              </p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                <li>• A booking will be created for you</li>
                <li>• Other provider offers will be declined</li>
                <li>• You can proceed to confirm and pay</li>
              </ul>
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setAcceptModal({ open: false, response: null })}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleAcceptQuote}
                loading={isAccepting}
              >
                Accept & Create Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={selectedImage} 
            alt="Damage" 
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default QuoteDetailPanel;


