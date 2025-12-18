import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  CreditCard, 
  User, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield
} from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { path: '/dashboard/quotes', icon: FileText, label: 'My Quotes' },
  { path: '/dashboard/bookings', icon: Calendar, label: 'My Bookings' },
  { path: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { path: '/dashboard/profile', icon: User, label: 'Profile' },
  { path: '/dashboard/support', icon: HelpCircle, label: 'Help & Support' },
];

const DashboardSidebar = () => {
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapse } = useDashboardStore();
  
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
          bg-white border-r border-slate-200
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
          w-[260px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-slate-900 whitespace-nowrap">
                AutoScreen
              </span>
            )}
          </Link>
          
          {/* Collapse toggle - desktop only */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(({ path, icon: Icon, label, end }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={end}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                    ${isActive ? 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary-600 before:rounded-full before:-ml-3' : ''}
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap">{label}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="
                      absolute left-full ml-2 px-2 py-1 
                      bg-slate-900 text-white text-sm rounded
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all duration-200 whitespace-nowrap z-50
                    ">
                      {label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <a
            href="/"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-slate-500 hover:bg-slate-50 hover:text-slate-700
              transition-all duration-200 group relative
            `}
          >
            <ExternalLink size={20} className="flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="whitespace-nowrap">Back to Homepage</span>
            )}
            
            {sidebarCollapsed && (
              <div className="
                absolute left-full ml-2 px-2 py-1 
                bg-slate-900 text-white text-sm rounded
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 whitespace-nowrap z-50
              ">
                Back to Homepage
              </div>
            )}
          </a>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;

