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

// Booking Flow Pages
import BookSearch from './pages/dashboard/BookSearch';
import ProviderList from './pages/dashboard/ProviderList';
import ProviderProfile from './pages/dashboard/ProviderProfile';
import BookingForm from './pages/dashboard/BookingForm';
import BookingPending from './pages/dashboard/BookingPending';
import BookingConfirmation from './pages/dashboard/BookingConfirmation';

const App = () => {
  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        
        {/* Booking Flow Routes */}
        <Route path="book" element={<BookSearch />} />
        <Route path="providers" element={<ProviderList />} />
        <Route path="providers/:id" element={<ProviderProfile />} />
        <Route path="book/:providerId" element={<BookingForm />} />
        <Route path="booking/pending/:bookingId" element={<BookingPending />} />
        <Route path="booking/confirmation/:bookingId" element={<BookingConfirmation />} />
        
        {/* Existing Routes */}
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
