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
  MessageSquare,
  CreditCard,
  Star
} from 'lucide-react';
import Drawer, { DrawerFooter } from '../ui/Drawer';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import Rating from '../ui/Rating';
import ConfirmModal from '../ui/ConfirmModal';
import Select from '../ui/Select';
import useDashboardStore, { formatDate, formatCurrency } from '../../store/useDashboardStore';

const BookingDetailDrawer = ({ booking, isOpen, onClose }) => {
  const { cancelBooking, addToast } = useDashboardStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!booking) return null;
  
  const handleCancel = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    cancelBooking(booking.id, cancelReason);
    setLoading(false);
    setShowCancelModal(false);
    onClose();
  };
  
  const handlePayNow = () => {
    addToast({ type: 'info', message: 'Redirecting to payment...' });
    onClose();
    // Would navigate to payment
  };
  
  const handleDownloadInvoice = () => {
    addToast({ type: 'success', message: 'Invoice downloaded' });
  };
  
  const handleContactProvider = () => {
    window.open(`tel:${booking.providerPhone}`, '_self');
  };
  
  const handleLeaveReview = () => {
    addToast({ type: 'info', message: 'Review feature coming soon!' });
  };
  
  const canCancel = ['Pending', 'Accepted', 'Confirmed'].includes(booking.status);
  const canPay = booking.paymentStatus === 'Unpaid' && ['Accepted', 'Confirmed'].includes(booking.status);
  const canReview = booking.status === 'Completed';
  
  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${booking.id}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} type="booking" size="md" />
            <StatusBadge status={booking.paymentStatus} type="payment" size="md" />
          </div>
          
          {/* Status Timeline */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-medium text-slate-900 mb-4">Booking Progress</h4>
            <div className="relative">
              {booking.timeline.map((step, index) => {
                const isLast = index === booking.timeline.length - 1;
                const isCancelled = step.status === 'Cancelled';
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                        ${step.completed 
                          ? isCancelled 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                          : 'bg-slate-200 text-slate-400'
                        }
                      `}>
                        {step.completed ? (
                          isCancelled ? <X size={14} /> : <CheckCircle size={14} />
                        ) : (
                          <Circle size={14} />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 ${step.completed ? 'bg-green-200' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className={`text-sm font-medium ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.status}
                      </p>
                      {step.date && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(step.date, 'datetime')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Booking Details */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Service Details</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Car size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Service</p>
                  <p className="font-medium text-slate-900">{booking.service}</p>
                  <p className="text-sm text-slate-600">{booking.vehicle}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date & Time</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(booking.scheduledDate, 'datetime')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium text-slate-900">{booking.locationType}</p>
                  <p className="text-sm text-slate-600">{booking.address}</p>
                </div>
              </div>
              
              {booking.notes && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">Special Notes</p>
                  <p className="text-sm text-slate-700">{booking.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Provider Details */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Provider</h4>
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                  {booking.providerName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{booking.providerName}</p>
                  <Rating 
                    value={booking.providerRating || 4.5} 
                    reviewCount={booking.providerReviews || 50}
                    size="sm"
                    className="mt-1"
                  />
                  <p className="text-sm text-slate-500 mt-1">{booking.providerPhone}</p>
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
          
          {/* Price Breakdown */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Price Breakdown</h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Service Amount</span>
                <span className="text-slate-900">{formatCurrency(booking.price.service)}</span>
              </div>
              {booking.price.callout > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Callout Fee</span>
                  <span className="text-slate-900">{formatCurrency(booking.price.callout)}</span>
                </div>
              )}
              {booking.price.materials > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Materials</span>
                  <span className="text-slate-900">{formatCurrency(booking.price.materials)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {formatCurrency(booking.price.total)}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <StatusBadge status={booking.paymentStatus} type="payment" size="md" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <DrawerFooter className="flex-col sm:flex-row gap-2">
          {canPay && (
            <Button onClick={handlePayNow} className="flex-1">
              <CreditCard size={16} />
              Pay Now
            </Button>
          )}
          {canReview && (
            <Button variant="secondary" onClick={handleLeaveReview} className="flex-1">
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
        message="Cancellation may be subject to provider's cancellation policy."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        type="danger"
        loading={loading}
      />
    </>
  );
};

export default BookingDetailDrawer;




