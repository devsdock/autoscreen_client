import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  CreditCard, 
  Settings,
  LogOut,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const mainMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/dashboard/quotes', icon: FileText, label: 'My Quotes' },
  { path: '/dashboard/bookings', icon: Calendar, label: 'My Bookings' },
  { path: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { path: '/dashboard/support', icon: MessageSquare, label: 'Messages', badge: 2 },
];

const generalItems = [
  { path: '/dashboard/profile', icon: Settings, label: 'Settings' },
];

const DashboardSidebar = () => {
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapse, addToast } = useDashboardStore();
  
  const handleLogout = () => {
    addToast({ type: 'info', message: 'You have been logged out' });
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen
          bg-white
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'}
          w-[240px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-slate-100
        `}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-slate-800 whitespace-nowrap">
                AutoScreen
              </span>
            )}
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          
          {/* Collapse toggle for desktop */}
          <button
            onClick={toggleSidebarCollapse}
            className={`
              hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors
              ${sidebarCollapsed ? 'mx-auto' : ''}
            `}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {/* Main Menu Section */}
          <div className="mb-6">
            {!sidebarCollapsed && (
              <p className="px-3 mb-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Main Menu
              </p>
            )}
            {sidebarCollapsed && <div className="mb-3 border-t border-slate-100 mx-2" />}
            
            <ul className="space-y-1">
              {mainMenuItems.map(({ path, icon: Icon, label, end, badge }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={end}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    style={({ isActive }) => isActive ? { backgroundColor: '#2563EB', color: 'white' } : {}}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3 py-2.5 rounded-lg
                      transition-all duration-200 group relative
                      ${isActive
                        ? 'shadow-sm font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                      <Icon size={20} className="flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="font-medium whitespace-nowrap">{label}</span>
                      )}
                    </div>
                    
                    {/* Badge */}
                    {badge && !sidebarCollapsed && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center bg-accent-red text-white text-xs font-medium rounded-full px-1.5">
                        {badge}
                      </span>
                    )}
                    
                    {/* Badge for collapsed state */}
                    {badge && sidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-red text-white text-[10px] font-medium rounded-full">
                        {badge}
                      </span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="
                        absolute left-full ml-2 px-2.5 py-1.5
                        bg-slate-800 text-white text-sm rounded-lg
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 whitespace-nowrap z-50
                        shadow-lg
                      ">
                        {label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* General Section */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 mb-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                General
              </p>
            )}
            {sidebarCollapsed && <div className="mb-3 border-t border-slate-100 mx-2" />}
            
            <ul className="space-y-1">
              {generalItems.map(({ path, icon: Icon, label }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    style={({ isActive }) => isActive ? { backgroundColor: '#2563EB', color: 'white' } : {}}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 group relative
                      ${isActive
                        ? 'shadow-sm font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="font-medium whitespace-nowrap">{label}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="
                        absolute left-full ml-2 px-2.5 py-1.5
                        bg-slate-800 text-white text-sm rounded-lg
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 whitespace-nowrap z-50
                        shadow-lg
                      ">
                        {label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
              
              {/* Logout */}
              <li>
                <button
                  onClick={handleLogout}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                    text-slate-600 hover:bg-slate-50 transition-all duration-200 group relative
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? 'Log out' : undefined}
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium whitespace-nowrap">Log out</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="
                      absolute left-full ml-2 px-2.5 py-1.5
                      bg-slate-800 text-white text-sm rounded-lg
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                      shadow-lg
                    ">
                      Log out
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                    </div>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Bottom Card - hide when collapsed */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Get a Quote</p>
                  <p className="text-xs text-slate-500">for your windscreen</p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>
            
            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <div className="w-2 h-2 bg-slate-200 rounded-full" />
              <div className="w-2 h-2 bg-slate-200 rounded-full" />
            </div>
          </div>
        )}
        
        {/* Collapsed state - show icon only */}
        {sidebarCollapsed && (
          <div className="p-3">
            <Link
              to="/dashboard/quotes"
              className="w-full flex items-center justify-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group relative"
              title="Get a Quote"
            >
              <Shield size={20} className="text-primary" />
              
              {/* Tooltip */}
              <div className="
                absolute left-full ml-2 px-2.5 py-1.5
                bg-slate-800 text-white text-sm rounded-lg
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 whitespace-nowrap z-50
                shadow-lg
              ">
                Get a Quote
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};

export default DashboardSidebar;
