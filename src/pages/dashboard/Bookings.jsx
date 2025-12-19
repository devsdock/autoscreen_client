import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Calendar, Filter } from 'lucide-react';
import useDashboardStore, { formatDate, formatCurrency } from '../../store/useDashboardStore';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import BookingDetailDrawer from '../../components/dashboard/BookingDetailDrawer';

const Bookings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { bookings } = useDashboardStore();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(
    id ? bookings.find(b => b.id === id) : null
  );
  
  // Filter logic
  const now = new Date();
  const tabs = [
    { value: 'all', label: 'All', count: bookings.length },
    { 
      value: 'upcoming', 
      label: 'Upcoming', 
      count: bookings.filter(b => 
        b.status === 'Confirmed' && new Date(b.scheduledDate) > now
      ).length 
    },
    { 
      value: 'inProgress', 
      label: 'In Progress', 
      count: bookings.filter(b => 
        (b.status === 'Accepted' || b.status === 'Confirmed') && 
        new Date(b.scheduledDate).toDateString() === now.toDateString()
      ).length 
    },
    { value: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'Completed').length },
    { value: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'Cancelled').length },
  ];
  
  const filteredBookings = bookings.filter(booking => {
    // Tab filter
    if (activeTab === 'upcoming' && !(booking.status === 'Confirmed' && new Date(booking.scheduledDate) > now)) return false;
    if (activeTab === 'inProgress' && !((booking.status === 'Accepted' || booking.status === 'Confirmed') && new Date(booking.scheduledDate).toDateString() === now.toDateString())) return false;
    if (activeTab === 'completed' && booking.status !== 'Completed') return false;
    if (activeTab === 'cancelled' && booking.status !== 'Cancelled') return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.id.toLowerCase().includes(query) ||
        booking.vehicle.toLowerCase().includes(query) ||
        booking.providerName.toLowerCase().includes(query) ||
        booking.service.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Sort by date, most recent first
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)
  );
  
  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    navigate(`/dashboard/bookings/${booking.id}`, { replace: true });
  };
  
  const handleCloseDrawer = () => {
    setSelectedBooking(null);
    navigate('/dashboard/bookings', { replace: true });
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle="Track your auto glass appointments"
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
          placeholder="Search bookings..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>
      
      {/* Bookings List */}
      {sortedBookings.length === 0 ? (
        <EmptyState
          iconType="bookings"
          title="No bookings yet"
          description="Accept a quote to create your first booking."
          actionLabel="Browse My Quotes"
          onAction={() => navigate('/dashboard/quotes')}
        />
      ) : (
        <div className="grid gap-4">
          {sortedBookings.map((booking) => (
            <Card 
              key={booking.id} 
              className="hover:shadow-card-hover transition-shadow cursor-pointer"
              onClick={() => handleViewBooking(booking)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between lg:justify-start gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-500">#{booking.id}</span>
                      <StatusBadge status={booking.status} type="booking" />
                      <StatusBadge status={booking.paymentStatus} type="payment" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900">{booking.service}</h3>
                    <p className="text-sm text-slate-500">{booking.vehicle}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span>{booking.providerName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(booking.scheduledDate, 'datetime')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(booking.price.total)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  <Button 
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewBooking(booking);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default Bookings;


