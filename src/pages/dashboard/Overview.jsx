import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  CreditCard,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
  User,
  MessageSquare,
  Receipt,
  FileCheck
} from 'lucide-react';
import useDashboardStore, { formatCurrency, formatDate, getRelativeTime } from '../../store/useDashboardStore';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import AlertBanner from '../../components/ui/AlertBanner';

// Activity type icons
const activityIcons = {
  quote_response: MessageSquare,
  quote_submitted: FileText,
  quote_accepted: FileCheck,
  booking_confirmed: Calendar,
  booking_completed: CheckCircle,
  booking_cancelled: Calendar,
  payment_completed: Receipt
};

const Overview = () => {
  const navigate = useNavigate();
  const { 
    user, 
    activities, 
    getStats, 
    getBookingStatusCounts, 
    getPaymentSummary,
    getNextUpcomingBooking,
    getQuotesNeedingAction,
    getUnpaidPayments
  } = useDashboardStore();
  
  const stats = getStats();
  const bookingCounts = getBookingStatusCounts();
  const paymentSummary = getPaymentSummary();
  const nextBooking = getNextUpcomingBooking();
  const quotesNeedingAction = getQuotesNeedingAction();
  const unpaidPayments = getUnpaidPayments();
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-slate-500 mt-1">
          Here's what's happening with your auto glass requests
        </p>
      </div>
      
      {/* Alert Banners */}
      {quotesNeedingAction.length > 0 && (
        <AlertBanner
          type="warning"
          message={`You have ${quotesNeedingAction.length} quote${quotesNeedingAction.length > 1 ? 's' : ''} awaiting your response`}
          actionLabel="View Quotes"
          onAction={() => navigate('/dashboard/quotes')}
        />
      )}
      
      {unpaidPayments.length > 0 && unpaidPayments[0] && (
        <AlertBanner
          type="info"
          message={`You have a pending payment of ${formatCurrency(unpaidPayments.reduce((sum, p) => sum + p.amount, 0))}`}
          actionLabel="Pay Now"
          onAction={() => navigate('/dashboard/payments')}
        />
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          value={stats.activeQuotes}
          label="Active Quotes"
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Calendar}
          value={stats.upcomingBookings}
          label="Upcoming Bookings"
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={CheckCircle}
          value={stats.completedJobs}
          label="Completed Jobs"
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={CreditCard}
          value={stats.pendingPaymentsCount}
          subValue={stats.pendingPaymentsTotal > 0 ? formatCurrency(stats.pendingPaymentsTotal) : undefined}
          label="Pending Payments"
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Upcoming Booking */}
          <Card>
            <CardHeader>
              <CardTitle>Your Next Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              {nextBooking ? (
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-slate-900">{nextBooking.service}</p>
                      <p className="text-sm text-slate-500">{nextBooking.providerName}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Clock size={16} className="text-slate-400" />
                        {formatDate(nextBooking.scheduledDate, 'datetime')}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-sm text-slate-600">
                      <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{nextBooking.locationType} — {nextBooking.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={nextBooking.status} type="booking" />
                      <StatusBadge status={nextBooking.paymentStatus} type="payment" />
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate(`/dashboard/bookings/${nextBooking.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Calendar size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No upcoming bookings</p>
                  <p className="text-sm text-slate-500 mt-1">Request a quote to get started</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/dashboard/quotes/new')}
                  >
                    <Plus size={18} />
                    Request a Quote
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Booking Status Summary */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Booking Status Overview</CardTitle>
              <Link 
                to="/dashboard/bookings" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: 'Pending', count: bookingCounts.pending, color: 'bg-amber-500' },
                  { label: 'Accepted', count: bookingCounts.accepted, color: 'bg-blue-500' },
                  { label: 'Confirmed', count: bookingCounts.confirmed, color: 'bg-green-500' },
                  { label: 'Completed', count: bookingCounts.completed, color: 'bg-slate-400' },
                  { label: 'Cancelled', count: bookingCounts.cancelled, color: 'bg-red-500' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-2xl font-bold text-slate-900">{count}</span>
                    </div>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity, index) => {
                  const Icon = activityIcons[activity.type] || FileText;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{activity.message}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {getRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-center"
                onClick={() => navigate('/dashboard/quotes/new')}
              >
                <Plus size={18} />
                Request a Quote
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-center"
                onClick={() => navigate('/dashboard/bookings')}
              >
                <Calendar size={18} />
                View Bookings
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-center"
                onClick={() => navigate('/dashboard/profile')}
              >
                <User size={18} />
                Update Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Payment Summary */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Payment Summary</CardTitle>
              <Link 
                to="/dashboard/payments" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Unpaid', data: paymentSummary.unpaid, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Processing', data: paymentSummary.pending, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Paid', data: paymentSummary.paid, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Refunded', data: paymentSummary.refunded, color: 'text-slate-500', bg: 'bg-slate-50' },
                ].map(({ label, data, color, bg }) => (
                  <div key={label} className={`flex items-center justify-between p-3 rounded-lg ${bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${color}`}>{data.count}</span>
                      <span className="text-sm text-slate-600">{label}</span>
                    </div>
                    <span className={`text-sm font-medium ${color}`}>
                      {formatCurrency(data.total)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;

