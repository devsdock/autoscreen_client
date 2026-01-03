import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CreditCard, Wallet, Calendar, Receipt, Download } from 'lucide-react';
import useDashboardStore, { formatDate, formatCurrency } from '../../store/useDashboardStore';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import PaymentModal from '../../components/dashboard/PaymentModal';

const Payments = () => {
  const { payments, getPaymentSummary, addToast } = useDashboardStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const summary = getPaymentSummary();
  const totalSpent = summary.paid.total;
  const pendingTotal = summary.unpaid.total + summary.pending.total;
  const lastPaid = payments.filter(p => p.status === 'Paid').sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0];
  
  const tabs = [
    { value: 'all', label: 'All', count: payments.length },
    { value: 'pending', label: 'Pending', count: payments.filter(p => p.status === 'Unpaid' || p.status === 'Pending').length },
    { value: 'completed', label: 'Completed', count: payments.filter(p => p.status === 'Paid').length },
    { value: 'refunded', label: 'Refunded', count: payments.filter(p => p.status === 'Refunded').length },
  ];
  
  const filteredPayments = payments.filter(payment => {
    // Tab filter
    if (activeTab === 'pending' && payment.status !== 'Unpaid' && payment.status !== 'Pending') return false;
    if (activeTab === 'completed' && payment.status !== 'Paid') return false;
    if (activeTab === 'refunded' && payment.status !== 'Refunded') return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.id.toLowerCase().includes(query) ||
        payment.bookingRef.toLowerCase().includes(query) ||
        payment.service.toLowerCase().includes(query) ||
        payment.providerName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Sort by date, most recent first
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    const dateA = a.date || a.dueDate;
    const dateB = b.date || b.dueDate;
    return new Date(dateB) - new Date(dateA);
  });
  
  const handleDownloadReceipt = (payment) => {
    addToast({ type: 'success', message: 'Receipt downloaded' });
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="View payment history and pending invoices"
      />
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Wallet}
          value={formatCurrency(totalSpent)}
          label="Total Spent"
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={CreditCard}
          value={formatCurrency(pendingTotal)}
          label="Pending Payments"
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={Receipt}
          value={lastPaid ? formatCurrency(lastPaid.amount) : '—'}
          subValue={lastPaid ? `on ${formatDate(lastPaid.date)}` : undefined}
          label="Last Payment"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab}
          variant="pills"
        />
        <Input
          placeholder="Search payments..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>
      
      {/* Payments List */}
      {sortedPayments.length === 0 ? (
        <EmptyState
          iconType="payments"
          title="No payments yet"
          description="Payments are created when you accept a quote and confirm a booking."
        />
      ) : (
        <Card padding={false}>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Payment ID
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Booking
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Service
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Provider
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Method
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600">#{payment.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        to={`/dashboard/bookings/${payment.bookingId}`}
                        className="font-mono text-sm text-primary-600 hover:text-primary-700"
                      >
                        {payment.bookingRef}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900">{payment.service}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{payment.providerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {payment.date ? formatDate(payment.date) : `Due ${formatDate(payment.dueDate)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {payment.method || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} type="payment" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'Unpaid' && (
                        <Button size="sm" onClick={() => setSelectedPayment(payment)}>
                          Pay Now
                        </Button>
                      )}
                      {payment.status === 'Paid' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleDownloadReceipt(payment)}
                        >
                          <Download size={14} />
                          Receipt
                        </Button>
                      )}
                      {(payment.status === 'Pending' || payment.status === 'Refunded') && (
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {sortedPayments.map((payment) => (
              <div key={payment.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm text-slate-500">#{payment.id}</span>
                    <p className="font-semibold text-slate-900 mt-1">{payment.service}</p>
                    <p className="text-sm text-slate-500">{payment.providerName}</p>
                  </div>
                  <StatusBadge status={payment.status} type="payment" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {payment.date ? formatDate(payment.date) : `Due ${formatDate(payment.dueDate)}`}
                    </p>
                  </div>
                  <div>
                    {payment.status === 'Unpaid' && (
                      <Button size="sm" onClick={() => setSelectedPayment(payment)}>
                        Pay Now
                      </Button>
                    )}
                    {payment.status === 'Paid' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleDownloadReceipt(payment)}
                      >
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Payment Modal */}
      <PaymentModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
};

export default Payments;




