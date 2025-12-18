import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, HelpCircle, ChevronDown, User, LogOut, Menu } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Avatar from '../ui/Avatar';

const DashboardTopBar = () => {
  const { user, toggleSidebar, addToast } = useDashboardStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6">
      {/* Left side - Mobile menu + Search */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search something"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 lg:w-80 pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Right side - Notifications + Help + Profile */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors relative">
          <Bell size={20} />
        </button>
        
        {/* Help */}
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
          <HelpCircle size={20} />
        </button>
        
        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 mx-2" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Avatar 
              name={`${user.firstName} ${user.lastName}`} 
              size="sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 hidden md:block" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                <p className="text-sm font-medium text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link 
                  to="/dashboard/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
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
