import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, MessageSquare } from 'lucide-react';
import useDashboardStore, { formatDate } from '../../store/useDashboardStore';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import NewQuoteModal from '../../components/dashboard/NewQuoteModal';

const Quotes = () => {
  const navigate = useNavigate();
  const { quotes } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  
  const tabs = [
    { value: 'all', label: 'All', count: quotes.length },
    { value: 'open', label: 'Open', count: quotes.filter(q => q.status === 'Open').length },
    { value: 'responses', label: 'Responses Received', count: quotes.filter(q => q.status === 'Received Responses').length },
    { value: 'accepted', label: 'Accepted', count: quotes.filter(q => q.status === 'Accepted').length },
    { value: 'closed', label: 'Expired/Closed', count: quotes.filter(q => q.status === 'Expired' || q.status === 'Closed').length },
  ];
  
  const filteredQuotes = quotes.filter(quote => {
    // Tab filter
    if (activeTab === 'open' && quote.status !== 'Open') return false;
    if (activeTab === 'responses' && quote.status !== 'Received Responses') return false;
    if (activeTab === 'accepted' && quote.status !== 'Accepted') return false;
    if (activeTab === 'closed' && quote.status !== 'Expired' && quote.status !== 'Closed') return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        quote.id.toLowerCase().includes(query) ||
        quote.vehicle.toLowerCase().includes(query) ||
        quote.glassType.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quotes"
        subtitle="Request quotes and compare provider offers"
        actionLabel="Request New Quote"
        actionIcon={Plus}
        onAction={() => setShowNewQuoteModal(true)}
      />
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab}
          variant="pills"
          className="overflow-x-auto"
        />
        <Input
          placeholder="Search by quote ID or vehicle..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>
      
      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <EmptyState
          iconType="quotes"
          title="No quotes yet"
          description="Request your first quote to compare providers and prices."
          actionLabel="Request a Quote"
          onAction={() => setShowNewQuoteModal(true)}
        />
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-card-hover transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between lg:justify-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-500">#{quote.id}</span>
                        <StatusBadge status={quote.status} type="quote" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mt-1">{quote.vehicle}</h3>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>{quote.glassType}</span>
                    <span className="text-slate-300">•</span>
                    <span>{quote.serviceType}</span>
                    <span className="text-slate-300">•</span>
                    <span>{quote.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">
                      Requested {formatDate(quote.dateRequested)}
                    </span>
                    {quote.responsesCount > 0 ? (
                      <span className="flex items-center gap-1 text-primary-600 font-medium">
                        <MessageSquare size={14} />
                        {quote.responsesCount} provider{quote.responsesCount > 1 ? 's' : ''} responded
                      </span>
                    ) : (
                      <span className="text-slate-400">Awaiting responses</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  <Button 
                    variant="secondary"
                    onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* New Quote Modal */}
      <NewQuoteModal 
        isOpen={showNewQuoteModal} 
        onClose={() => setShowNewQuoteModal(false)} 
      />
    </div>
  );
};

export default Quotes;

