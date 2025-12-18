import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus,
  ChevronDown,
  Calendar,
  Truck,
  MapPin,
  Clock,
  MoreVertical,
  User,
  Package,
  CreditCard,
  CheckCircle,
  Circle
} from 'lucide-react';
import useDashboardStore, { formatCurrency, formatDate } from '../../store/useDashboardStore';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const Overview = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const { 
    user, 
    bookings, 
    quotes,
    getNextUpcomingBooking
  } = useDashboardStore();
  
  const nextBooking = getNextUpcomingBooking();
  const latestBooking = bookings[0];
  
  // Get today's date formatted
  const today = new Date();
  const dateRangeText = `${today.getDate().toString().padStart(2, '0')} - ${(today.getDate() + 7).toString().padStart(2, '0')} ${today.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`;

  const tabs = [
    { id: 'all', label: 'All Status' },
    { id: 'complete', label: 'Complete' },
    { id: 'in-transit', label: 'In Progress' },
    { id: 'processing', label: 'Pending' },
  ];

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    if (activeTab === 'complete') return booking.status === 'Completed';
    if (activeTab === 'in-transit') return booking.status === 'Confirmed';
    if (activeTab === 'processing') return booking.status === 'Pending';
    return true;
  });
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <div className="flex items-center gap-3 mt-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Week
              <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Calendar size={16} />
              {dateRangeText}
            </button>
          </div>
        </div>
        
        <Button onClick={() => navigate('/dashboard/quotes')}>
          <Plus size={18} />
          Request a Quote
        </Button>
      </div>
      
      {/* Main Booking Card */}
      {latestBooking && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left - Booking Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Booking ID</p>
                  <p className="text-xl font-bold text-slate-800 mt-0.5">№ {latestBooking.id}</p>
                </div>
              </div>
              
              {/* Info Pills */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <Truck size={16} className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{latestBooking.service}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <MapPin size={16} className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{latestBooking.locationType}</span>
                </div>
              </div>
              
              {/* Vehicle & Price Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="text-sm font-medium text-slate-700">{latestBooking.vehicle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Provider</p>
                    <p className="text-sm font-medium text-slate-700">{latestBooking.providerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm font-medium text-slate-700">{formatDate(latestBooking.scheduledDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="text-sm font-medium text-slate-700">{formatCurrency(latestBooking.price.total)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right - Image */}
            <div className="lg:w-72 h-44 bg-gradient-to-br from-blue-50 to-primary/10 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                  <Truck size={40} className="text-primary" />
                </div>
                <p className="text-sm font-medium text-slate-600">{latestBooking.service}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Section */}
      {latestBooking && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Booking Details</h2>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
          
          {/* Route Info Bar */}
          <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Package size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Booking ID</p>
                <p className="text-sm font-semibold text-slate-800">№ {latestBooking.id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <User size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Provider</p>
                <p className="text-sm font-semibold text-slate-800">{latestBooking.providerName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <Calendar size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Scheduled Date</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(latestBooking.scheduledDate, 'datetime')}</p>
              </div>
            </div>
            
            <StatusBadge status={latestBooking.status} type="booking" />
          </div>
          
          {/* Timeline */}
          <div className="pt-6 space-y-4">
            {latestBooking.timeline?.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {step.completed ? (
                    <CheckCircle size={20} className="text-success-green" />
                  ) : (
                    <Circle size={20} className="text-slate-300" />
                  )}
                  {index < latestBooking.timeline.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${step.completed ? 'bg-success-green' : 'bg-slate-200'}`} />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between pb-2">
                  <div>
                    <p className={`text-sm font-medium ${step.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.status}
                    </p>
                    {step.date && (
                      <p className="text-xs text-slate-500 mt-0.5">{latestBooking.address}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {step.date ? formatDate(step.date, 'datetime') : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-800">History</h2>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Booking ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Provider</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-800">№ {booking.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600">{booking.service}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600">{booking.vehicle}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600">{booking.providerName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600">{formatDate(booking.scheduledDate)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-800">{formatCurrency(booking.price.total)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={booking.status} type="booking" />
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
