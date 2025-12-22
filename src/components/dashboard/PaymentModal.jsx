import { useState } from 'react';
import { CreditCard, Building2, Zap, Lock } from 'lucide-react';
import Modal, { ModalActions } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import useDashboardStore, { formatCurrency } from '../../store/useDashboardStore';

const PaymentModal = ({ payment, isOpen, onClose }) => {
  const { processPayment } = useDashboardStore();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  
  if (!payment) return null;
  
  const handleCardChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
      formattedValue = formattedValue.replace(/(\d{4})/g, '$1 ').trim();
    }
    
    if (field === 'expiry') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    }
    
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }
    
    setCardDetails(prev => ({ ...prev, [field]: formattedValue }));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const method = paymentMethod === 'card' 
      ? `Card •••• ${cardDetails.number.slice(-4)}` 
      : 'EFT';
    
    processPayment(payment.id, method);
    setLoading(false);
    onClose();
  };
  
  const handleClose = () => {
    setPaymentMethod('card');
    setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Complete Payment"
      description={`Pay ${formatCurrency(payment.amount)} for ${payment.service}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Amount Summary */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Service Amount</span>
            <span className="text-slate-900">{formatCurrency(payment.breakdown.service)}</span>
          </div>
          {payment.breakdown.callout > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Callout Fee</span>
              <span className="text-slate-900">{formatCurrency(payment.breakdown.callout)}</span>
            </div>
          )}
          {payment.breakdown.materials > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Materials</span>
              <span className="text-slate-900">{formatCurrency(payment.breakdown.materials)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900 text-xl">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`
                p-4 border-2 rounded-xl text-center transition-all
                ${paymentMethod === 'card' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <CreditCard size={24} className={`mx-auto mb-2 ${paymentMethod === 'card' ? 'text-primary-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-primary-700' : 'text-slate-600'}`}>
                Card
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('eft')}
              className={`
                p-4 border-2 rounded-xl text-center transition-all
                ${paymentMethod === 'eft' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <Building2 size={24} className={`mx-auto mb-2 ${paymentMethod === 'eft' ? 'text-primary-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'eft' ? 'text-primary-700' : 'text-slate-600'}`}>
                EFT
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('instant')}
              className={`
                p-4 border-2 rounded-xl text-center transition-all
                ${paymentMethod === 'instant' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <Zap size={24} className={`mx-auto mb-2 ${paymentMethod === 'instant' ? 'text-primary-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === 'instant' ? 'text-primary-700' : 'text-slate-600'}`}>
                Instant EFT
              </span>
            </button>
          </div>
        </div>
        
        {/* Card Form */}
        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={(e) => handleCardChange('number', e.target.value)}
              icon={CreditCard}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => handleCardChange('expiry', e.target.value)}
              />
              <Input
                label="CVV"
                placeholder="123"
                type="password"
                value={cardDetails.cvv}
                onChange={(e) => handleCardChange('cvv', e.target.value)}
              />
            </div>
            <Input
              label="Cardholder Name"
              placeholder="Name on card"
              value={cardDetails.name}
              onChange={(e) => handleCardChange('name', e.target.value)}
            />
          </div>
        )}
        
        {/* EFT Instructions */}
        {paymentMethod === 'eft' && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-sm text-slate-600 font-medium">Bank Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank</span>
                <span className="text-slate-900 font-medium">First National Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Name</span>
                <span className="text-slate-900 font-medium">AutoScreen (Pty) Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number</span>
                <span className="text-slate-900 font-medium font-mono">62845912345</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch Code</span>
                <span className="text-slate-900 font-medium font-mono">250655</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference</span>
                <span className="text-slate-900 font-medium font-mono">{payment.id}</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-3">
              Please use your Payment ID as reference. EFT payments may take 1-3 business days to reflect.
            </p>
          </div>
        )}
        
        {/* Instant EFT Options */}
        {paymentMethod === 'instant' && (
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-primary-300 transition-colors text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-600">PF</span>
              </div>
              <span className="text-sm font-medium text-slate-700">PayFast</span>
            </button>
            <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-primary-300 transition-colors text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-600">OZ</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Ozow</span>
            </button>
          </div>
        )}
        
        {/* Security Note */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Lock size={14} />
          <span>Your payment is secured with 256-bit encryption</span>
        </div>
      </div>
      
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          loading={loading}
          disabled={paymentMethod === 'eft'}
        >
          {paymentMethod === 'eft' ? 'Mark as Paid (Admin)' : `Pay ${formatCurrency(payment.amount)}`}
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default PaymentModal;

