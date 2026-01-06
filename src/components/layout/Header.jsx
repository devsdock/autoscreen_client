import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import useStore from '../../store/useStore'
import useAuthStore from '../../store/useAuthStore'

const Header = () => {
  const { sidebarOpen, toggleSidebar } = useStore()
  const { user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className={`
        fixed top-0 right-0 z-10 h-16
        bg-white border-b border-slate-200
        flex items-center justify-between px-6
        transition-all duration-200
        ${sidebarOpen ? 'left-[250px]' : 'left-0 lg:left-[70px]'}
      `}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
          Customer Portal
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-[0.3rem] right-[0.4rem] w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            1
          </span>
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <User size={16} className="text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user?.name || 'Customer'}
            </span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Customer'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <User size={16} />
                <span>Profile</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="border-t border-slate-100 mt-1">
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
  )
}

export default Header

