import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, HelpCircle, ChevronDown, User, LogOut, Menu, Sun, Moon, Monitor } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import useAuthStore from '../../store/useAuthStore';
import Avatar from '../ui/Avatar';
import { NodeURL } from '../../services/api';

const ThemeToggle = () => {
  const { theme, setTheme } = useDashboardStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  
  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];
  
  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title={`Theme: ${currentTheme.label}`}
      >
        <CurrentIcon size={20} />
      </button>
      
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTheme(id);
                setDropdownOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${theme === id 
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon size={16} />
              <span>{label}</span>
              {theme === id && (
                <span className="ml-auto w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardTopBar = () => {
  const { toggleSidebar, addToast } = useDashboardStore();
  const { user, logout } = useAuthStore();
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
  
  const handleLogout = async () => {
    addToast({ type: 'info', message: 'Logging out...' });
    setDropdownOpen(false);
    await logout();
  };
  
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 transition-colors">
      {/* Left side - Mobile menu + Search */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        
        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search something"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 lg:w-80 pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-0 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right side - Theme + Notifications + Help + Profile */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
          <Bell size={20} />
        </button>
        
        {/* Help */}
        <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <HelpCircle size={20} />
        </button>
        
        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Avatar 
              src={
                user?.avatar 
                || (user?.profileImage 
                    ? (user.profileImage.startsWith('http') 
                        ? user.profileImage 
                        : `${NodeURL}${user.profileImage}`)
                    : null)
              }
              name={user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'} 
              size="sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 hidden md:block" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 md:hidden">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link 
                  to="/dashboard/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
