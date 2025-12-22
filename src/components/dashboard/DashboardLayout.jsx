import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import ToastContainer from '../ui/Toast';
import useDashboardStore from '../../store/useDashboardStore';

const DashboardLayout = () => {
  const { sidebarCollapsed, setSidebarOpen } = useDashboardStore();

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
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      <DashboardTopBar />
      
      <main
        className={`
          pt-16 min-h-screen
          transition-all duration-300
          ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}
        `}
      >
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
      
      <ToastContainer />
    </div>
  );
};

export default DashboardLayout;

