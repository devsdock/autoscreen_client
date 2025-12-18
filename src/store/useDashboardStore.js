import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userData } from '../data/user';
import { vehiclesData } from '../data/vehicles';
import { addressesData } from '../data/addresses';
import { quotesData } from '../data/quotes';
import { quoteResponsesData } from '../data/quoteResponses';
import { bookingsData } from '../data/bookings';
import { paymentsData } from '../data/payments';
import { activitiesData } from '../data/activities';

// Helper to generate IDs
const generateId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

// Helper to format currency
export const formatCurrency = (amount) => {
  return `R ${amount.toLocaleString('en-ZA')}`;
};

// Helper to format date
export const formatDate = (dateString, format = 'short') => {
  const date = new Date(dateString);
  if (format === 'short') {
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'long') {
    return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (format === 'time') {
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (format === 'datetime') {
    return `${formatDate(dateString, 'short')} at ${formatDate(dateString, 'time')}`;
  }
  return date.toLocaleDateString('en-ZA');
};

// Helper for relative time
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  return `${diffWeeks} weeks ago`;
};

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // User data
      user: userData,
      
      // Vehicles
      vehicles: vehiclesData,
      
      // Addresses
      addresses: addressesData,
      
      // Quotes
      quotes: quotesData,
      quoteResponses: quoteResponsesData,
      
      // Bookings
      bookings: bookingsData,
      
      // Payments
      payments: paymentsData,
      
      // Activities
      activities: activitiesData,
      
      // UI State
      sidebarOpen: true,
      sidebarCollapsed: false,
      toasts: [],
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Toast actions
      addToast: (toast) => {
        const id = Date.now();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }]
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
          }));
        }, toast.duration || 4000);
        return id;
      },
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),
      
      // User actions
      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),
      
      // Vehicle actions
      addVehicle: (vehicle) => {
        const id = generateId('VEH');
        set((state) => ({
          vehicles: [...state.vehicles, { ...vehicle, id }]
        }));
        get().addToast({ type: 'success', message: 'Vehicle added successfully' });
        return id;
      },
      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) => 
            v.id === id ? { ...v, ...updates } : v
          )
        }));
        get().addToast({ type: 'success', message: 'Vehicle updated successfully' });
      },
      deleteVehicle: (id) => {
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id)
        }));
        get().addToast({ type: 'success', message: 'Vehicle removed' });
      },
      
      // Address actions
      addAddress: (address) => {
        const id = generateId('ADDR');
        set((state) => {
          let addresses = state.addresses;
          if (address.isDefault) {
            addresses = addresses.map((a) => ({ ...a, isDefault: false }));
          }
          return { addresses: [...addresses, { ...address, id }] };
        });
        get().addToast({ type: 'success', message: 'Address added successfully' });
        return id;
      },
      updateAddress: (id, updates) => {
        set((state) => {
          let addresses = state.addresses;
          if (updates.isDefault) {
            addresses = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
          }
          return {
            addresses: addresses.map((a) => 
              a.id === id ? { ...a, ...updates } : a
            )
          };
        });
        get().addToast({ type: 'success', message: 'Address updated successfully' });
      },
      deleteAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id)
        }));
        get().addToast({ type: 'success', message: 'Address removed' });
      },
      
      // Quote actions
      createQuote: (quoteData) => {
        const id = generateId('QT');
        const vehicle = get().vehicles.find((v) => v.id === quoteData.vehicleId);
        const address = get().addresses.find((a) => a.id === quoteData.addressId);
        
        const newQuote = {
          id,
          ...quoteData,
          vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : quoteData.vehicle,
          location: address ? `${address.suburb}, ${address.city}` : quoteData.location,
          status: 'Open',
          dateRequested: new Date().toISOString(),
          responsesCount: 0
        };
        
        set((state) => ({
          quotes: [newQuote, ...state.quotes]
        }));
        
        // Add activity
        get().addActivity({
          type: 'quote_submitted',
          message: `New quote request #${id} submitted`,
          relatedId: id
        });
        
        get().addToast({ type: 'success', message: 'Quote request submitted! Providers will respond soon.' });
        return id;
      },
      
      acceptQuote: (quoteId, responseId) => {
        const quote = get().quotes.find((q) => q.id === quoteId);
        const response = get().quoteResponses.find((r) => r.id === responseId);
        
        if (!quote || !response) return null;
        
        // Update quote status
        set((state) => ({
          quotes: state.quotes.map((q) => 
            q.id === quoteId 
              ? { ...q, status: 'Accepted', acceptedResponseId: responseId }
              : q
          )
        }));
        
        // Create booking
        const bookingId = generateId('BK');
        const vehicle = get().vehicles.find((v) => v.id === quote.vehicleId);
        const address = get().addresses.find((a) => a.id === quote.addressId);
        
        const newBooking = {
          id: bookingId,
          quoteId,
          quoteResponseId: responseId,
          customerId: get().user.id,
          providerId: response.providerId,
          providerName: response.providerName,
          providerPhone: '+27 11 234 5678',
          providerRating: response.providerRating,
          providerReviews: response.providerReviews,
          service: `${quote.glassType} ${quote.serviceType}`,
          vehicle: quote.vehicle,
          scheduledDate: new Date(response.availability).toISOString(),
          locationType: 'Mobile',
          address: address ? `${address.street}, ${address.suburb}, ${address.city}` : 'Address pending',
          notes: quote.notes,
          status: 'Pending',
          paymentStatus: 'Unpaid',
          price: {
            service: response.price * 0.9,
            callout: response.price * 0.08,
            materials: response.price * 0.02,
            total: response.price
          },
          timeline: [
            { status: 'Quote Accepted', date: new Date().toISOString(), completed: true },
            { status: 'Booking Confirmed', date: null, completed: false },
            { status: 'Appointment Scheduled', date: response.availability, completed: false },
            { status: 'Job Completed', date: null, completed: false },
            { status: 'Payment Received', date: null, completed: false }
          ],
          createdAt: new Date().toISOString()
        };
        
        set((state) => ({
          bookings: [newBooking, ...state.bookings]
        }));
        
        // Create payment record
        const paymentId = generateId('PAY');
        const newPayment = {
          id: paymentId,
          bookingId,
          bookingRef: `#${bookingId}`,
          customerId: get().user.id,
          providerId: response.providerId,
          providerName: response.providerName,
          service: `${quote.glassType} ${quote.serviceType}`,
          amount: response.price,
          breakdown: {
            service: Math.round(response.price * 0.9),
            callout: Math.round(response.price * 0.08),
            materials: Math.round(response.price * 0.02),
            platformFee: 0
          },
          status: 'Unpaid',
          method: null,
          date: null,
          dueDate: response.availability.split('T')[0]
        };
        
        set((state) => ({
          payments: [newPayment, ...state.payments]
        }));
        
        // Add activity
        get().addActivity({
          type: 'quote_accepted',
          message: `Quote accepted from ${response.providerName} for ${formatCurrency(response.price)}`,
          relatedId: quoteId
        });
        
        get().addToast({ type: 'success', message: 'Quote accepted! Booking created.' });
        return bookingId;
      },
      
      closeQuote: (quoteId) => {
        set((state) => ({
          quotes: state.quotes.map((q) => 
            q.id === quoteId ? { ...q, status: 'Closed' } : q
          )
        }));
        get().addToast({ type: 'info', message: 'Quote closed' });
      },
      
      // Booking actions
      confirmBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: 'Confirmed',
              timeline: b.timeline.map((t, i) => 
                i <= 1 ? { ...t, completed: true, date: t.date || new Date().toISOString() } : t
              )
            };
          })
        }));
        get().addActivity({
          type: 'booking_confirmed',
          message: `Booking #${bookingId} confirmed`,
          relatedId: bookingId
        });
        get().addToast({ type: 'success', message: 'Booking confirmed!' });
      },
      
      cancelBooking: (bookingId, reason) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: 'Cancelled',
              cancellationReason: reason,
              timeline: [...b.timeline.slice(0, 2), { status: 'Cancelled', date: new Date().toISOString(), completed: true }]
            };
          })
        }));
        
        // Also update payment status
        const booking = get().bookings.find((b) => b.id === bookingId);
        if (booking) {
          set((state) => ({
            payments: state.payments.map((p) => 
              p.bookingId === bookingId && p.status === 'Unpaid'
                ? { ...p, status: 'Refunded', refundDate: new Date().toISOString().split('T')[0] }
                : p
            )
          }));
        }
        
        get().addActivity({
          type: 'booking_cancelled',
          message: `Booking #${bookingId} was cancelled`,
          relatedId: bookingId
        });
        get().addToast({ type: 'info', message: 'Booking cancelled' });
      },
      
      completeBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: 'Completed',
              timeline: b.timeline.map((t, i) => 
                i <= 3 ? { ...t, completed: true, date: t.date || new Date().toISOString() } : t
              )
            };
          })
        }));
        get().addActivity({
          type: 'booking_completed',
          message: `Booking #${bookingId} marked as completed`,
          relatedId: bookingId
        });
        get().addToast({ type: 'success', message: 'Booking completed!' });
      },
      
      // Payment actions
      processPayment: (paymentId, method) => {
        const payment = get().payments.find((p) => p.id === paymentId);
        if (!payment) return;
        
        set((state) => ({
          payments: state.payments.map((p) => 
            p.id === paymentId 
              ? { 
                  ...p, 
                  status: 'Paid', 
                  method,
                  date: new Date().toISOString().split('T')[0]
                } 
              : p
          )
        }));
        
        // Update booking payment status and timeline
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== payment.bookingId) return b;
            return {
              ...b,
              paymentStatus: 'Paid',
              timeline: b.timeline.map((t) => 
                t.status === 'Payment Received' 
                  ? { ...t, completed: true, date: new Date().toISOString() }
                  : t
              )
            };
          })
        }));
        
        get().addActivity({
          type: 'payment_completed',
          message: `Payment of ${formatCurrency(payment.amount)} completed for booking ${payment.bookingRef}`,
          relatedId: paymentId
        });
        get().addToast({ type: 'success', message: 'Payment successful!' });
      },
      
      // Activity actions
      addActivity: (activity) => {
        const id = generateId('ACT');
        set((state) => ({
          activities: [{ ...activity, id, timestamp: new Date().toISOString() }, ...state.activities]
        }));
      },
      
      // Computed values
      getStats: () => {
        const state = get();
        
        const activeQuotes = state.quotes.filter(
          (q) => q.status === 'Open' || q.status === 'Received Responses'
        ).length;
        
        const upcomingBookings = state.bookings.filter(
          (b) => b.status === 'Confirmed' && new Date(b.scheduledDate) > new Date()
        ).length;
        
        const completedJobs = state.bookings.filter(
          (b) => b.status === 'Completed'
        ).length;
        
        const pendingPayments = state.payments.filter((p) => p.status === 'Unpaid');
        const pendingPaymentsTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        
        return {
          activeQuotes,
          upcomingBookings,
          completedJobs,
          pendingPaymentsCount: pendingPayments.length,
          pendingPaymentsTotal
        };
      },
      
      getBookingStatusCounts: () => {
        const bookings = get().bookings;
        return {
          pending: bookings.filter((b) => b.status === 'Pending').length,
          accepted: bookings.filter((b) => b.status === 'Accepted').length,
          confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
          completed: bookings.filter((b) => b.status === 'Completed').length,
          cancelled: bookings.filter((b) => b.status === 'Cancelled').length
        };
      },
      
      getPaymentSummary: () => {
        const payments = get().payments;
        const unpaid = payments.filter((p) => p.status === 'Unpaid');
        const pending = payments.filter((p) => p.status === 'Pending');
        const paid = payments.filter((p) => p.status === 'Paid');
        const refunded = payments.filter((p) => p.status === 'Refunded');
        
        return {
          unpaid: { count: unpaid.length, total: unpaid.reduce((s, p) => s + p.amount, 0) },
          pending: { count: pending.length, total: pending.reduce((s, p) => s + p.amount, 0) },
          paid: { count: paid.length, total: paid.reduce((s, p) => s + p.amount, 0) },
          refunded: { count: refunded.length, total: refunded.reduce((s, p) => s + p.amount, 0) }
        };
      },
      
      getNextUpcomingBooking: () => {
        const bookings = get().bookings;
        const upcoming = bookings
          .filter((b) => b.status === 'Confirmed' && new Date(b.scheduledDate) > new Date())
          .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
        return upcoming[0] || null;
      },
      
      getQuoteResponses: (quoteId) => {
        return get().quoteResponses.filter((r) => r.quoteId === quoteId);
      },
      
      getQuotesNeedingAction: () => {
        return get().quotes.filter((q) => q.status === 'Received Responses');
      },
      
      getUnpaidPayments: () => {
        return get().payments.filter((p) => p.status === 'Unpaid');
      }
    }),
    {
      name: 'autoscreen-dashboard',
      partialize: (state) => ({
        user: state.user,
        vehicles: state.vehicles,
        addresses: state.addresses,
        quotes: state.quotes,
        quoteResponses: state.quoteResponses,
        bookings: state.bookings,
        payments: state.payments,
        activities: state.activities,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);

export default useDashboardStore;

