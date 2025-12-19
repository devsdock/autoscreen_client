import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import DashboardRightSidebar from './DashboardRightSidebar';
import ToastContainer from '../ui/Toast';
import useDashboardStore from '../../store/useDashboardStore';

const DashboardLayout = () => {
  const { sidebarCollapsed, setSidebarOpen, initTheme } = useDashboardStore();

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const theme = useDashboardStore.getState().theme;
      if (theme === 'system') {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [initTheme]);

  // Auto-close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Sidebar */}
      <DashboardSidebar />
      
      {/* Main area */}
      <div 
        className={`
          min-h-screen flex flex-col
          transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}
          xl:mr-[320px]
        `}
      >
        {/* Top Bar */}
        <DashboardTopBar />
        
        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Right Sidebar */}
      <DashboardRightSidebar />
      
      <ToastContainer />
    </div>
  );
};

export default DashboardLayout;
