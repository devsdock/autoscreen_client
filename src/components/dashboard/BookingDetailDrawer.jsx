import { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Car,
  CheckCircle,
  Circle,
  X,
  Download,
  CreditCard,
  Star,
  Shield,
  Loader2
} from 'lucide-react';
import Drawer, { DrawerFooter } from '../ui/Drawer';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import Rating from '../ui/Rating';
import ConfirmModal from '../ui/ConfirmModal';
import useDashboardStore, { formatDate, formatCurrency } from '../../store/useDashboardStore';
import bookingService from '../../services/bookingService';

const BookingDetailDrawer = ({ booking, isOpen, onClose, onUpdate }) => {
  const { addToast } = useDashboardStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!booking) return null;
  
  const handleCancel = async () => {
    setLoading(true);
    try {
      await bookingService.cancelBooking(booking.id, cancelReason);
      addToast({ type: 'success', message: 'Booking cancelled successfully' });
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      addToast({ type: 'error', message: 'Failed to cancel booking' });
    } finally {
      setLoading(false);
      setShowCancelModal(false);
    }
  };
  
  const handlePayNow = () => {
    // In a real app, this would navigate to the payment page/modal
    // For now, if it's accepted, we can redirect to the pending page where payment happens
    window.location.href = `/dashboard/booking/pending/${booking.id}`;
    onClose();
  };
  
  const handleDownloadInvoice = () => {
    addToast({ type: 'success', message: 'Invoice download started...' });
  };
  
  const handleContactProvider = () => {
    if (booking.providerPhone) {
      window.open(`tel:${booking.providerPhone}`, '_self');
    } else {
      addToast({ type: 'info', message: 'Provider phone number not available' });
    }
  };
  
  const canCancel = ['Pending', 'Accepted', 'Confirmed', 'Pending Payment'].includes(booking.status);
  const canPay = booking.paymentStatus === 'Unpaid' && ['Accepted', 'Confirmed', 'Pending Payment'].includes(booking.status);
  const canReview = booking.status === 'Completed';
  
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${booking.reference}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} type="booking" size="md" />
            <StatusBadge status={booking.paymentStatus} type="payment" size="md" />
          </div>
          
          {/* Status Timeline */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Booking Progress</h4>
            <div className="relative">
              {booking.timeline?.map((step, index) => {
                const isLast = index === booking.timeline.length - 1;
                const isCancelled = step.status === 'Cancelled';
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                        ${step.completed 
                          ? isCancelled 
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                        }
                      `}>
                        {step.completed ? (
                          isCancelled ? <X size={14} /> : <CheckCircle size={14} />
                        ) : (
                          <Circle size={14} />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 ${step.completed ? 'bg-green-200 dark:bg-green-900/50' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className={`text-sm font-medium ${step.completed ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        {step.status}
                      </p>
                      {step.date && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDate(step.date, 'datetime')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {!booking.timeline && <p className="text-sm text-slate-400 italic">No progress data available</p>}
            </div>
          </div>
          
          {/* Booking Details */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Service Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Car size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Service</p>
                  <p className="font-medium text-slate-900 dark:text-white">{booking.service}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{booking.vehicle}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Date & Time</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatDate(booking.scheduledDate, 'datetime')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                  <p className="font-medium text-slate-900 dark:text-white">{booking.locationType}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{booking.address}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Provider Details */}
          {booking.providerName && (
            <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Provider</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {booking.providerName.charAt(0)}
                    </div>
                    <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{booking.providerName}</p>
                    <Rating 
                        value={booking.providerRating || 0} 
                        reviewCount={booking.providerReviews || 0}
                        size="sm"
                        className="mt-1"
                    />
                    </div>
                </div>
                <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleContactProvider}
                >
                    <Phone size={14} />
                    Call
                </Button>
                </div>
            </div>
          )}
          
          {/* Price Breakdown */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Price Breakdown</h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Service Amount</span>
                <span className="text-slate-900 dark:text-white">{formatCurrency(booking.price?.service || 0)}</span>
              </div>
              {booking.price?.callout > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Callout Fee</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(booking.price.callout)}</span>
                </div>
              )}
              {booking.price?.materials > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Materials</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(booking.price.materials)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                    {formatCurrency(booking.price?.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <DrawerFooter className="flex-col sm:flex-row gap-2">
          {canPay && (
            <Button onClick={handlePayNow} className="flex-1">
              <CreditCard size={16} />
              Confirm & Pay
            </Button>
          )}
          {canReview && (
            <Button variant="secondary" className="flex-1">
              <Star size={16} />
              Leave Review
            </Button>
          )}
          <Button variant="secondary" onClick={handleDownloadInvoice}>
            <Download size={16} />
            Invoice
          </Button>
          {canCancel && (
            <Button variant="danger" onClick={() => setShowCancelModal(true)}>
              Cancel Booking
            </Button>
          )}
        </DrawerFooter>
      </Drawer>
      
      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel this booking?"
        message="Are you sure you want to cancel this booking? Cancellation may be subject to a fee if outside the grace period."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        type="danger"
        loading={loading}
      />
    </>
  );
};

export default BookingDetailDrawer;
