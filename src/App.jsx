import { Routes, Route, Navigate } from "react-router-dom";

// Dashboard Layout and Pages
import DashboardLayout from "./components/dashboard/DashboardLayout";
import OverviewNew from "./pages/dashboard/OverviewNew";
import QuotesNew from "./pages/dashboard/QuotesNew";
import QuoteDetailPage from "./pages/dashboard/QuoteDetailPage";
import NewQuote from "./pages/dashboard/NewQuote";
import Bookings from "./pages/dashboard/Bookings";
import BookAppointment from "./pages/dashboard/BookAppointment";
import Payments from "./pages/dashboard/Payments";
import Profile from "./pages/dashboard/Profile";
import Support from "./pages/dashboard/Support";
import Messages from "./pages/dashboard/Messages";
import Vehicles from "./pages/dashboard/Vehicles";
import Insurance from "./pages/dashboard/Insurance";

// Auth Protection
import ProtectedRoute from "./components/ProtectedRoute";

import { useEffect } from "react";
import { useSettingsStore } from "./store/useSettingsStore";
import MaintenancePage from "./pages/MaintenancePage";
import ImpersonatePage from "./pages/auth/ImpersonatePage";

const App = () => {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (settings?.maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/impersonate" element={<ImpersonatePage />} />

      {/* Dashboard Routes - Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewNew />} />

        {/* New Routes */}
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="insurance" element={<Insurance />} />

        {/* Existing Routes */}
        <Route path="quotes" element={<QuotesNew />} />
        <Route path="quotes/new" element={<NewQuote />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="quotes/:id/book-appointment" element={<BookAppointment />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<Bookings />} />
        <Route path="bookings/:id/:action" element={<Bookings />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:id" element={<Payments />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<Profile />} />
        <Route path="support" element={<Support />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
