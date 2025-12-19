import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, CheckCircle, CreditCard, ArrowRight, Star, MapPin, 
  Calendar, Car, FileText, Shield, Loader2
} from 'lucide-react';
import useDashboardStore, { formatCurrency, formatDate } from '../../store/useDashboardStore';
import Button from '../../components/ui/Button';
import Modal, { ModalActions } from '../../components/ui/Modal';

const BookingPending = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { 
    getBookingById, 
    simulateProviderAcceptance, 
    processBookingPayment,
    getProviderById 
  } = useDashboardStore();
  
  const booking = getBookingById(bookingId);
  const provider = booking ? getProviderById(booking.providerId) : null;
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Booking not found</h2>
        <Button onClick={() => navigate('/dashboard/bookings')}>View All Bookings</Button>
      </div>
    );
  }
  
  const handleSimulateAcceptance = () => {
    simulateProviderAcceptance(bookingId);
  };
  
  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    processBookingPayment(bookingId, selectedPaymentMethod);
    setIsProcessing(false);
    setIsPaymentModalOpen(false);
    navigate(`/dashboard/booking/confirmation/${bookingId}`);
  };
  
  const isPending = booking.status === 'Pending';
  const isAccepted = booking.status === 'Accepted';
  const isConfirmed = booking.status === 'Confirmed';
  
  const statusConfig = {
    Pending: {
      icon: Clock,
      title: 'Waiting for Provider',
      description: 'Your booking request has been sent. The provider will review and accept shortly.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    Accepted: {
      icon: CheckCircle,
      title: 'Provider Accepted!',
      description: 'Great news! The provider has accepted your booking. Complete payment to confirm.',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    Confirmed: {
      icon: Shield,
      title: 'Booking Confirmed',
      description: 'Your booking is confirmed. See you on the scheduled date!',
      color: 'text-primary-500',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      borderColor: 'border-primary-200 dark:border-primary-800'
    }
  };
  
  const currentStatus = statusConfig[booking.status] || statusConfig.Pending;
  const StatusIcon = currentStatus.icon;
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Status Banner */}
      <div className={`rounded-2xl ${currentStatus.bgColor} border ${currentStatus.borderColor} p-6 mb-6 text-center`}>
        <div className={`w-16 h-16 ${currentStatus.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <StatusIcon size={32} className={currentStatus.color} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{currentStatus.title}</h1>
        <p className="text-slate-600 dark:text-slate-400">{currentStatus.description}</p>
        
        {/* Booking Reference */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full">
          <span className="text-sm text-slate-500 dark:text-slate-400">Booking Reference:</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">{booking.reference}</span>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Booking Progress</h3>
        <div className="space-y-4">
          {booking.timeline.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.completed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {step.completed ? <CheckCircle size={18} /> : <div className="w-2 h-2 bg-current rounded-full" />}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${step.completed ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {step.status}
                </p>
                {step.date && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(step.date, 'datetime')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Booking Details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Booking Details</h3>
        
        {/* Provider */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
            {booking.providerName?.charAt(0) || 'P'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-white">{booking.providerName}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Star size={14} className="text-amber-400" fill="currentColor" />
              {booking.providerRating} ({booking.providerReviews} reviews)
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <FileText size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Service</p>
              <p className="font-medium text-slate-900 dark:text-white">{booking.service?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{booking.glassType}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Car size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vehicle</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Date & Time</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatDate(booking.scheduledDate, 'long')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{booking.timeSlot}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
              <p className="font-medium text-slate-900 dark:text-white">{booking.address?.line1}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.address?.city} {booking.address?.postcode}
              </p>
            </div>
          </div>
        </div>
        
        {/* Price */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Total</span>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(booking.price?.total || 0)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {isPending && (
          <>
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="animate-pulse flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Loader2 size={20} className="animate-spin" />
                <span>Waiting for provider response...</span>
              </div>
            </div>
            
            {/* Demo Control */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
                Demo Mode: Simulate provider actions
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleSimulateAcceptance}
              >
                <CheckCircle size={18} />
                Simulate Provider Acceptance
              </Button>
            </div>
          </>
        )}
        
        {isAccepted && (
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Complete your payment to confirm the booking
            </p>
            <Button size="lg" className="w-full" onClick={() => setIsPaymentModalOpen(true)}>
              <CreditCard size={20} />
              Pay Now — {formatCurrency(booking.price?.total || 0)}
            </Button>
          </div>
        )}
        
        {isConfirmed && (
          <div className="text-center">
            <Button 
              variant="primary" 
              onClick={() => navigate(`/dashboard/booking/confirmation/${bookingId}`)}
            >
              View Confirmation
              <ArrowRight size={18} />
            </Button>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard/bookings')}>
            View All Bookings
          </Button>
        </div>
      </div>
      
      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Payment"
        size="md"
      >
        <div className="space-y-6">
          {/* Price Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Service</span>
                <span>{formatCurrency(booking.price?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Platform fee</span>
                <span>{formatCurrency(booking.price?.platformFee || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total</span>
                <span className="text-primary-600 dark:text-primary-400">
                  {formatCurrency(booking.price?.total || 0)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Select Payment Method
            </label>
            <div className="space-y-2">
              {[
                { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                { id: 'eft', label: 'EFT Bank Transfer', icon: FileText },
                { id: 'cash', label: 'Cash on Service', icon: Shield }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  <method.icon size={20} className={
                    selectedPaymentMethod === method.id 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-slate-400'
                  } />
                  <span className={
                    selectedPaymentMethod === method.id 
                      ? 'font-medium text-primary-600 dark:text-primary-400' 
                      : 'text-slate-700 dark:text-slate-300'
                  }>
                    {method.label}
                  </span>
                  {selectedPaymentMethod === method.id && (
                    <CheckCircle size={18} className="ml-auto text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Card Form (Mock) */}
          {selectedPaymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <ModalActions>
          <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Pay {formatCurrency(booking.price?.total || 0)}
              </>
            )}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default BookingPending;

