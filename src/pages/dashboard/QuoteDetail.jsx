import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  FileText,
  Star,
  BadgeCheck,
  Award,
  Calendar,
  MessageSquare
} from 'lucide-react';
import useDashboardStore, { formatDate, formatCurrency } from '../../store/useDashboardStore';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Rating from '../../components/ui/Rating';
import ConfirmModal from '../../components/ui/ConfirmModal';
import EmptyState from '../../components/ui/EmptyState';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotes, getQuoteResponses, acceptQuote, addToast } = useDashboardStore();
  
  const quote = quotes.find(q => q.id === id);
  const responses = getQuoteResponses(id);
  
  const [acceptingResponse, setAcceptingResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  
  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Quote not found</p>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/dashboard/quotes')}
          className="mt-4"
        >
          <ArrowLeft size={18} />
          Back to Quotes
        </Button>
      </div>
    );
  }
  
  const handleAcceptQuote = async () => {
    if (!acceptingResponse) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const bookingId = acceptQuote(quote.id, acceptingResponse.id);
    setLoading(false);
    setAcceptingResponse(null);
    
    if (bookingId) {
      navigate(`/dashboard/bookings/${bookingId}`);
    }
  };
  
  const handleMessageProvider = () => {
    addToast({ type: 'info', message: 'Messaging feature coming soon!' });
  };
  
  const canAcceptQuotes = quote.status === 'Open' || quote.status === 'Received Responses';
  
  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link 
        to="/dashboard/quotes"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Quotes
      </Link>
      
      {/* Quote Summary Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg text-slate-900">#{quote.id}</span>
              <StatusBadge status={quote.status} type="quote" size="md" />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{quote.vehicle}</h2>
              <p className="text-slate-600 mt-1">
                {quote.glassType} · {quote.serviceType}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-slate-400" />
                {quote.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-slate-400" />
                Requested {formatDate(quote.dateRequested)}
              </span>
            </div>
            
            {quote.notes && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">Notes:</span> {quote.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Provider Responses */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Provider Responses {responses.length > 0 && `(${responses.length})`}
        </h3>
        
        {responses.length === 0 ? (
          <Card>
            <EmptyState
              icon={MessageSquare}
              title="Waiting for providers to respond"
              description="You'll be notified when quotes arrive. Most quotes are received within 2-4 hours."
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {responses.map((response) => (
              <Card 
                key={response.id}
                className={`
                  ${quote.acceptedResponseId === response.id ? 'ring-2 ring-green-500 bg-green-50/50' : ''}
                `}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Provider Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                        {response.providerName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{response.providerName}</h4>
                          {response.providerVerified && (
                            <span className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full">
                              <BadgeCheck size={12} />
                              Verified
                            </span>
                          )}
                          {response.providerTopRated && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              <Award size={12} />
                              Top Rated
                            </span>
                          )}
                        </div>
                        <Rating 
                          value={response.providerRating} 
                          reviewCount={response.providerReviews}
                          size="sm"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    {/* Quote Details */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(response.price)}
                        </p>
                        <p className="text-xs text-slate-500">Quoted price</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        Available {formatDate(response.availability)}
                      </div>
                    </div>
                    
                    {response.note && (
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {response.note}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    {quote.acceptedResponseId === response.id ? (
                      <div className="text-center text-green-600 font-medium text-sm py-2 px-4 bg-green-100 rounded-lg">
                        ✓ Quote Accepted
                      </div>
                    ) : canAcceptQuotes ? (
                      <>
                        <Button onClick={() => setAcceptingResponse(response)}>
                          Accept Quote
                        </Button>
                        <Button variant="secondary" onClick={handleMessageProvider}>
                          Message Provider
                        </Button>
                      </>
                    ) : (
                      <Button variant="secondary" onClick={handleMessageProvider}>
                        Message Provider
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Accept Quote Confirmation Modal */}
      <ConfirmModal
        isOpen={!!acceptingResponse}
        onClose={() => setAcceptingResponse(null)}
        onConfirm={handleAcceptQuote}
        title="Accept this quote?"
        message={acceptingResponse ? `Accept quote from ${acceptingResponse.providerName} for ${formatCurrency(acceptingResponse.price)}? This will create a booking.` : ''}
        confirmLabel="Accept Quote"
        type="info"
        loading={loading}
      />
    </div>
  );
};

export default QuoteDetail;



