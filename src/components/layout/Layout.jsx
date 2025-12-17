import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import useStore from '../../store/useStore'

const Layout = () => {
  const { sidebarOpen, setSidebarOpen } = useStore()

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <main
        className={`
          pt-16 min-h-screen
          transition-all duration-200
          ${sidebarOpen ? 'lg:pl-[250px]' : 'lg:pl-[70px]'}
        `}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout

