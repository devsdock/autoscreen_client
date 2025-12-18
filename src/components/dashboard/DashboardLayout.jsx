import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';
import DashboardRightSidebar from './DashboardRightSidebar';
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
    <div className="min-h-screen bg-slate-50/50">
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
