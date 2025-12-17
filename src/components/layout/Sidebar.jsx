import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import useStore from '../../store/useStore'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen
          bg-sidebar text-white
          transition-all duration-200 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'w-[250px]' : 'w-[70px]'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={20} />
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-lg whitespace-nowrap">AutoScreen</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-sidebar-active text-white'
                      : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={toggleSidebar}
            className="
              w-full flex items-center justify-center gap-2 px-3 py-2.5
              text-slate-300 hover:bg-sidebar-hover hover:text-white
              rounded-lg transition-all duration-200
            "
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft size={20} />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

