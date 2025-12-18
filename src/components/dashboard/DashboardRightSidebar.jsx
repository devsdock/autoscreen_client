import { MoreVertical, Plus, Minus, MessageSquare, Phone } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Avatar from '../ui/Avatar';

const DashboardRightSidebar = () => {
  const { providers } = useDashboardStore();
  const topProvider = providers?.[0];
  
  return (
    <aside className="hidden xl:block fixed top-0 right-0 w-[320px] h-screen bg-white border-l border-slate-100 p-5 overflow-y-auto">
      {/* Route Map Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Service Area Map</h3>
          <button className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
        
        {/* Map Visual */}
        <div className="relative h-52 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl overflow-hidden mb-3">
          {/* Simple map representation */}
          <div className="absolute inset-0 opacity-30">
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
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <p className="text-xs font-medium text-slate-700">Gauteng, SA</p>
          </div>
          
          {/* Info overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
            <p className="text-xs text-slate-500">Service Providers</p>
            <p className="text-lg font-bold text-slate-800">12 Active</p>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="flex items-center justify-end gap-1">
          <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Plus size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Minus size={16} />
          </button>
        </div>
      </div>

      {/* Provider Card */}
      {topProvider && (
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Avatar name={topProvider.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Top Provider</p>
              <p className="font-semibold text-slate-800 truncate">{topProvider.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                <MessageSquare size={16} />
              </button>
              <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                <Phone size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Quick Stats</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary">2</p>
            <p className="text-xs text-slate-600 mt-1">Active Quotes</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-success-green">3</p>
            <p className="text-xs text-slate-600 mt-1">Completed</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-warning-amber">1</p>
            <p className="text-xs text-slate-600 mt-1">Pending</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-700">5</p>
            <p className="text-xs text-slate-600 mt-1">Total Jobs</p>
          </div>
        </div>
      </div>

      {/* Recent Providers */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Providers</h3>
          <button className="text-xs text-primary font-medium hover:text-dark-blue transition-colors">
            See All
          </button>
        </div>
        
        <div className="space-y-3">
          {providers?.slice(0, 3).map((provider) => (
            <div key={provider.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <Avatar name={provider.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{provider.name}</p>
                <p className="text-xs text-slate-500">{provider.location}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-warning-amber">★</span>
                <span className="text-xs font-medium text-slate-700">{provider.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default DashboardRightSidebar;
