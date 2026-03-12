import { MoreVertical, Plus, Minus, MessageSquare, Phone } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Avatar from '../ui/Avatar';

/**
 * DashboardRightSidebar Component
 * 
 * Currently hidden via SHOW_RIGHT_SIDEBAR flag in DashboardLayout.jsx
 * To re-enable: Set SHOW_RIGHT_SIDEBAR = true in DashboardLayout.jsx
 * 
 * This component displays:
 * - Service area map
 * - Top provider info
 * - Quick stats (dynamic from store)
 * - Recent providers list
 */
const DashboardRightSidebar = () => {
  const { providers, quotes, bookings } = useDashboardStore();
  const topProvider = providers?.[0];
  
  // Calculate dynamic stats from store data
  const activeQuotes = quotes?.filter(q => q.status === 'Open' || q.status === 'pending')?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'Completed' || b.status === 'completed')?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === 'Pending' || b.status === 'pending' || b.status === 'Confirmed' || b.status === 'confirmed')?.length || 0;
  const totalJobs = bookings?.length || 0;
  const activeProviders = providers?.length || 0;
  
  return (
    <aside className="hidden xl:block fixed top-0 right-0 w-[320px] h-screen bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-5 overflow-y-auto transition-colors">
      {/* Route Map Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Service Area Map</h3>
          <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
        
        {/* Map Visual */}
        <div className="relative h-52 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-slate-800 dark:to-slate-700 rounded-xl overflow-hidden mb-3">
          {/* Simple map representation */}
          <div className="absolute inset-0 opacity-30 dark:opacity-50">
            <svg viewBox="0 0 200 150" className="w-full h-full">
              {/* Road lines */}
              <path d="M20 80 Q 60 40, 100 60 T 180 80" stroke="#2563EB" strokeWidth="2" fill="none" strokeDasharray="4,2" />
              <path d="M30 100 Q 80 120, 120 90 T 170 110" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
              <path d="M40 60 L 160 60" stroke="#94a3b8" strokeWidth="1" fill="none" strokeDasharray="2,2" />
              
              {/* Location markers */}
              <circle cx="50" cy="75" r="6" fill="#2563EB" />
              <circle cx="100" cy="60" r="4" fill="#16A34A" />
              <circle cx="150" cy="85" r="6" fill="#F59E0B" />
            </svg>
          </div>
          
          {/* Location label */}
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Gauteng, SA</p>
          </div>
          
          {/* Info overlay - Dynamic count */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">Service Providers</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{activeProviders} Active</p>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="flex items-center justify-end gap-1">
          <button className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Plus size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Minus size={16} />
          </button>
        </div>
      </div>

      {/* Provider Card */}
      {topProvider && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Avatar name={topProvider.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">Top Provider</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{topProvider.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <MessageSquare size={16} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <Phone size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Now Dynamic */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Quick Stats</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{activeQuotes}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Active Quotes</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-success-600 dark:text-success-500">{completedBookings}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Completed</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-warning-600 dark:text-warning-500">{pendingBookings}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pending</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{totalJobs}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Total Jobs</p>
          </div>
        </div>
      </div>

      {/* Recent Providers */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Recent Providers</h3>
          <button className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            See All
          </button>
        </div>
        
        <div className="space-y-3">
          {providers?.slice(0, 3).map((provider) => (
            <div key={provider.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Avatar name={provider.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{provider.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{typeof provider.location === "object" ? provider.location.city || "" : provider.location || ""}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-warning-500">★</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{provider.rating}</span>
              </div>
            </div>
          ))}
          
          {/* Empty state */}
          {(!providers || providers.length === 0) && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">No providers yet</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightSidebar;

