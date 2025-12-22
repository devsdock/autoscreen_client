import { Routes, Route, Navigate } from 'react-router-dom';

// Dashboard Layout and Pages
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Quotes from './pages/dashboard/Quotes';
import QuoteDetail from './pages/dashboard/QuoteDetail';
import Bookings from './pages/dashboard/Bookings';
import Payments from './pages/dashboard/Payments';
import Profile from './pages/dashboard/Profile';
import Support from './pages/dashboard/Support';

const App = () => {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="quotes/new" element={<Quotes />} />
        <Route path="quotes/:id" element={<QuoteDetail />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<Bookings />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:id" element={<Payments />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<Profile />} />
        <Route path="support" element={<Support />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
