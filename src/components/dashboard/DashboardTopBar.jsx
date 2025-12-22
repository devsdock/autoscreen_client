import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, Settings, LogOut, HelpCircle } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Avatar from '../ui/Avatar';

// Route to title mapping
const routeTitles = {
  '/dashboard': 'Overview',
  '/dashboard/quotes': 'My Quotes',
  '/dashboard/quotes/new': 'Request a Quote',
  '/dashboard/bookings': 'My Bookings',
  '/dashboard/payments': 'Payments',
  '/dashboard/profile': 'My Profile',
  '/dashboard/profile/edit': 'Edit Profile',
  '/dashboard/support': 'Help & Support'
};

const DashboardTopBar = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, user, addToast } = useDashboardStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  
  // Get current page title
  const getPageTitle = () => {
    // Check for exact match first
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname];
    }
    
    // Check for dynamic routes
    if (location.pathname.startsWith('/dashboard/quotes/')) {
      return 'Quote Details';
    }
    if (location.pathname.startsWith('/dashboard/bookings/')) {
      return 'Booking Details';
    }
    
    return 'Dashboard';
  };
  
  // Mock notifications
  const notifications = [
    { id: 1, message: 'Quote #QT-1234 received 2 responses', time: '2h ago', unread: true },
    { id: 2, message: 'Booking #BK-5678 confirmed', time: '1d ago', unread: true },
    { id: 3, message: 'Payment received for #BK-5672', time: '3d ago', unread: false },
  ];
  
  const unreadCount = notifications.filter(n => n.unread).length;
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLogout = () => {
    addToast({ type: 'info', message: 'You have been logged out' });
    setDropdownOpen(false);
  };
  
  return (
    <header
      className={`
        fixed top-0 right-0 z-10 h-16
        bg-white border-b border-slate-200
        flex items-center justify-between px-4 lg:px-6
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]'}
        left-0
      `}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-danger-600 text-white text-xs font-medium rounded-full px-1">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      notification.unread ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <p className="text-sm text-slate-700">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
              {user.firstName}
            </span>
            <ChevronDown size={16} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link 
                  to="/dashboard/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </Link>
                <Link 
                  to="/dashboard/support"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardTopBar;

