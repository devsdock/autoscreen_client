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
import { providersData } from '../data/providers';
import { reviewsData } from '../data/reviews';

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
      
      // Providers
      providers: providersData,
      
      // Reviews
      reviews: reviewsData,
      
      // Search/Booking flow state
      searchCriteria: null,
      
      // UI State
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light', // 'light', 'dark', or 'system'
      toasts: [],
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      initTheme: () => {
        const theme = get().theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          }
        }
      },
      
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
        const year = new Date().getFullYear();
        const count = get().quotes.length + 1;
        const reference = `Q-${year}-${count.toString().padStart(5, '0')}`;
        
        const newQuote = {
          id,
          reference,
          customerId: get().user.id,
          createdAt: new Date().toISOString(),
          status: 'Open',
          vehicle: {
            make: quoteData.vehicleMake,
            model: quoteData.vehicleModel,
            year: parseInt(quoteData.vehicleYear)
          },
          serviceType: quoteData.serviceType,
          glassType: quoteData.glassType,
          location: {
            city: quoteData.city,
            postcode: quoteData.postcode || '',
            addressLine1: quoteData.addressLine1 || ''
          },
          preferredDate: quoteData.preferredDate || null,
          preferredTimeSlot: quoteData.preferredTimeSlot || 'Any time',
          notes: quoteData.notes || '',
          images: quoteData.images || [],
          responsesCount: 0
        };
        
        set((state) => ({
          quotes: [newQuote, ...state.quotes]
        }));
        
        // Add activity
        get().addActivity({
          type: 'quote_submitted',
          message: `New quote request ${reference} submitted`,
          relatedId: id
        });
        
        get().addToast({ type: 'success', message: 'Quote request sent successfully!' });
        return id;
      },
      
      closeQuoteRequest: (quoteId) => {
        set((state) => ({
          quotes: state.quotes.map((q) => 
            q.id === quoteId ? { ...q, status: 'Closed' } : q
          )
        }));
        get().addToast({ type: 'info', message: 'Quote request closed' });
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
        
        // Mark selected response as accepted, others as rejected
        set((state) => ({
          quoteResponses: state.quoteResponses.map((r) => {
            if (r.quoteRequestId === quoteId) {
              return { ...r, status: r.id === responseId ? 'Accepted' : 'Rejected' };
            }
            return r;
          })
        }));
        
        // Create draft booking
        const bookingId = generateId('BK');
        const bookingRef = `B-${new Date().getFullYear()}-${(get().bookings.length + 1).toString().padStart(5, '0')}`;
        
        const vehicleStr = `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`;
        const addressStr = quote.location.addressLine1 
          ? `${quote.location.addressLine1}, ${quote.location.city}` 
          : quote.location.city;
        
        const newBooking = {
          id: bookingId,
          reference: bookingRef,
          source: 'QuoteAccepted',
          quoteId,
          quoteResponseId: responseId,
          customerId: get().user.id,
          providerId: response.provider.id,
          providerName: response.provider.name,
          providerPhone: '+27 11 234 5678',
          providerRating: response.provider.rating,
          providerReviews: response.provider.reviewsCount,
          service: `${quote.glassType} ${quote.serviceType}`,
          vehicle: vehicleStr,
          scheduledDate: response.etaText.includes('Available') 
            ? new Date(response.etaText.replace('Available ', '')).toISOString() 
            : new Date().toISOString(),
          locationType: 'Mobile',
          address: addressStr,
          notes: quote.notes,
          status: 'Pending',
          paymentStatus: 'Unpaid',
          price: {
            service: Math.round(response.price * 0.9),
            callout: Math.round(response.price * 0.08),
            materials: Math.round(response.price * 0.02),
            total: response.price
          },
          timeline: [
            { status: 'Quote Accepted', date: new Date().toISOString(), completed: true },
            { status: 'Booking Confirmed', date: null, completed: false },
            { status: 'Appointment Scheduled', date: null, completed: false },
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
      
      // Note: closeQuoteRequest is defined above in Quote actions
      
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
      
      // Search & Booking flow actions
      setSearchCriteria: (criteria) => set({ searchCriteria: criteria }),
      
      searchProviders: (criteria) => {
        const providers = get().providers;
        let filtered = [...providers];
        
        // Filter by city/location
        if (criteria?.city) {
          const cityLower = criteria.city.toLowerCase();
          filtered = filtered.filter(p => 
            p.serviceAreas.some(area => area.toLowerCase().includes(cityLower)) ||
            p.address.city.toLowerCase().includes(cityLower)
          );
        }
        
        // Filter by service type if specified
        if (criteria?.serviceType) {
          filtered = filtered.filter(p => 
            p.services.some(s => 
              s.name.toLowerCase().includes(criteria.serviceType.toLowerCase()) ||
              s.name.toLowerCase().includes(criteria.glassType?.toLowerCase() || '')
            )
          );
        }
        
        return filtered;
      },
      
      getProviderById: (providerId) => {
        return get().providers.find(p => p.id === providerId);
      },
      
      getProviderReviews: (providerId) => {
        return get().reviews.filter(r => r.providerId === providerId);
      },
      
      // Create booking from the booking flow
      createBookingFromFlow: (bookingData) => {
        const id = generateId('BK');
        const year = new Date().getFullYear();
        const count = get().bookings.length + 1;
        const reference = `B-${year}-${count.toString().padStart(5, '0')}`;
        
        const provider = get().providers.find(p => p.id === bookingData.providerId);
        
        // Calculate prices
        const subtotal = bookingData.service.fromPrice;
        const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
        const total = subtotal + platformFee;
        
        const newBooking = {
          id,
          reference,
          source: 'DirectBooking',
          customerId: get().user.id,
          providerId: bookingData.providerId,
          providerName: provider?.name || bookingData.providerName,
          providerType: provider?.type || 'Business',
          providerPhone: provider?.phone || '',
          providerRating: provider?.rating || 0,
          providerReviews: provider?.reviewsCount || 0,
          vehicle: bookingData.vehicle,
          service: {
            id: bookingData.service.id,
            name: bookingData.service.name,
            fromPrice: bookingData.service.fromPrice,
            durationMins: bookingData.service.durationMins
          },
          glassType: bookingData.glassType,
          scheduledDate: bookingData.scheduledDate,
          timeSlot: bookingData.timeSlot,
          address: bookingData.address,
          remarks: bookingData.remarks || '',
          uploadedImages: bookingData.uploadedImages || [],
          status: 'Pending',
          paymentStatus: 'Unpaid',
          price: {
            subtotal,
            platformFee,
            total
          },
          timeline: [
            { status: 'Request Sent', date: new Date().toISOString(), completed: true },
            { status: 'Provider Accepted', date: null, completed: false },
            { status: 'Payment Completed', date: null, completed: false },
            { status: 'Booking Confirmed', date: null, completed: false },
            { status: 'Job Completed', date: null, completed: false }
          ],
          createdAt: new Date().toISOString(),
          acceptedAt: null,
          paidAt: null
        };
        
        set((state) => ({
          bookings: [newBooking, ...state.bookings]
        }));
        
        get().addActivity({
          type: 'booking_created',
          message: `Booking request ${reference} sent to ${provider?.name}`,
          relatedId: id
        });
        
        get().addToast({ type: 'success', message: 'Booking request sent successfully!' });
        return id;
      },
      
      // Simulate provider acceptance (for prototype demo)
      simulateProviderAcceptance: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map(b => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: 'Accepted',
              acceptedAt: new Date().toISOString(),
              timeline: b.timeline.map((t, i) => 
                i <= 1 ? { ...t, completed: true, date: t.date || new Date().toISOString() } : t
              )
            };
          })
        }));
        
        get().addActivity({
          type: 'booking_accepted',
          message: `Provider accepted booking #${bookingId}`,
          relatedId: bookingId
        });
        
        get().addToast({ type: 'success', message: 'Provider has accepted your booking!' });
      },
      
      // Process booking payment and confirm
      processBookingPayment: (bookingId, method) => {
        const booking = get().bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        set((state) => ({
          bookings: state.bookings.map(b => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: 'Confirmed',
              paymentStatus: 'Paid',
              paidAt: new Date().toISOString(),
              timeline: b.timeline.map((t, i) => 
                i <= 3 ? { ...t, completed: true, date: t.date || new Date().toISOString() } : t
              )
            };
          })
        }));
        
        // Create payment record
        const paymentId = generateId('PAY');
        const newPayment = {
          id: paymentId,
          bookingId,
          bookingRef: booking.reference,
          customerId: get().user.id,
          providerId: booking.providerId,
          providerName: booking.providerName,
          service: booking.service.name,
          amount: booking.price.total,
          breakdown: {
            service: booking.price.subtotal,
            platformFee: booking.price.platformFee
          },
          status: 'Paid',
          method,
          date: new Date().toISOString().split('T')[0]
        };
        
        set((state) => ({
          payments: [newPayment, ...state.payments]
        }));
        
        get().addActivity({
          type: 'payment_completed',
          message: `Payment of ${formatCurrency(booking.price.total)} for booking ${booking.reference}`,
          relatedId: bookingId
        });
        
        get().addToast({ type: 'success', message: 'Payment successful! Booking confirmed.' });
        return paymentId;
      },
      
      getBookingById: (bookingId) => {
        return get().bookings.find(b => b.id === bookingId);
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
        reviews: state.reviews,
        searchCriteria: state.searchCriteria,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme
      })
    }
  )
);

export default useDashboardStore;

