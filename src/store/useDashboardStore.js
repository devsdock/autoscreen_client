import { create } from "zustand";
import { persist } from "zustand/middleware";
import { userData } from "../data/user";
import { vehiclesData } from "../data/vehicles";
import { addressesData } from "../data/addresses";
import { quotesData } from "../data/quotes";
import { quoteResponsesData } from "../data/quoteResponses";
import { bookingsData } from "../data/bookings";
import { paymentsData } from "../data/payments";
import { activitiesData } from "../data/activities";
import { providersData } from "../data/providers";
import { reviewsData } from "../data/reviews";
import { messagesData } from "../data/messages";

// Helper to generate IDs
const generateId = (prefix) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}`;

// Helper to format currency
export const formatCurrency = (amount) => {
  return `R ${amount.toLocaleString("en-ZA")}`;
};

// Helper to format date
export const formatDate = (dateString, format = "short") => {
  if (!dateString) return "-";

  let date;
  if (
    typeof dateString === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    const [y, m, d] = dateString.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return "-";

  if (format === "short") {
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (format === "long") {
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (format === "time") {
    return date.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (format === "datetime") {
    return `${formatDate(dateString, "short")} at ${formatDate(
      dateString,
      "time",
    )}`;
  }
  return date.toLocaleDateString("en-ZA");
};

// Helper for relative time
export const getRelativeTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  return `${diffWeeks} weeks ago`;
};

const useDashboardStore = create(
  persist(
    (set, get) => ({
      // User data
      user: null,

      // Vehicles
      vehicles: [],

      // Addresses
      addresses: [],

      // Quotes
      quotes: [],
      quoteResponses: [],

      // Bookings
      bookings: [],

      // Payments
      payments: [],

      // Activities
      activities: [],

      // Providers
      providers: providersData, // Keep providers as they are searchable/browsable

      // Reviews
      reviews: [],

      // Messages / Conversations
      messages: messagesData,

      // Search/Booking flow state
      searchCriteria: null,

      // UI State
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "light", // 'light', 'dark', or 'system'
      toasts: [],

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (theme === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          // System preference
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          if (prefersDark) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
      initTheme: () => {
        const theme = get().theme;
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else if (theme === "system") {
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          if (prefersDark) {
            document.documentElement.classList.add("dark");
          }
        }
      },

      // Toast actions
      addToast: (toast) => {
        const id = Date.now();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, toast.duration || 4000);
        return id;
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // User actions
      updateUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),

      clearData: () =>
        set({
          user: null,
          vehicles: [],
          addresses: [],
          quotes: [],
          quoteResponses: [],
          bookings: [],
          payments: [],
          activities: [],
          reviews: [],
          messages: messagesData,
          searchCriteria: null,
        }),

      // Vehicle actions
      setVehicles: (vehicles) => set({ vehicles }),
      addVehicle: (vehicle) => {
        const id = vehicle.id || vehicle._id || generateId("VEH");
        set((state) => ({
          vehicles: [...state.vehicles, { ...vehicle, id }],
        }));
        get().addToast({
          type: "success",
          message: "Vehicle added successfully",
        });
        return id;
      },
      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...updates } : v,
          ),
        }));
        get().addToast({
          type: "success",
          message: "Vehicle updated successfully",
        });
      },
      deleteVehicle: (id) => {
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
        }));
        get().addToast({ type: "success", message: "Vehicle removed" });
      },

      // Address actions
      setAddresses: (addresses) => set({ addresses }),
      addAddress: (address) => {
        const id = address.id || address._id || generateId("ADDR");
        set((state) => {
          let addresses = state.addresses;
          if (address.isDefault) {
            addresses = addresses.map((a) => ({ ...a, isDefault: false }));
          }
          return { addresses: [...addresses, { ...address, id }] };
        });
        get().addToast({
          type: "success",
          message: "Address added successfully",
        });
        return id;
      },
      updateAddress: (id, updates) => {
        set((state) => {
          let addresses = state.addresses;
          if (updates.isDefault) {
            addresses = addresses.map((a) => ({
              ...a,
              isDefault: a.id === id,
            }));
          }
          return {
            addresses: addresses.map((a) =>
              a.id === id ? { ...a, ...updates } : a,
            ),
          };
        });
        get().addToast({
          type: "success",
          message: "Address updated successfully",
        });
      },
      deleteAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        }));
        get().addToast({ type: "success", message: "Address removed" });
      },

      // Quote actions
      setQuotes: (quotes) => set({ quotes }),
      fetchQuotes: async () => {
        try {
          const quoteService = (await import("../services/quoteService"))
            .default;
          const response = await quoteService.getQuotes();
          if (response.success) {
            const { mapQuote } = await import("../utils/dataMappers");
            const mappedQuotes = response.data.map(mapQuote);

            // Extract responses from quotes
            const allResponses = [];
            mappedQuotes.forEach((q) => {
              if (q.responses && Array.isArray(q.responses)) {
                q.responses.forEach((r) => {
                  allResponses.push({
                    ...r,
                    id: r._id || r.id,
                    quoteRequestId: q.id,
                    provider: r.provider || { name: "Provider" }, // Ensure provider exists
                  });
                });
              }
            });

            set({
              quotes: mappedQuotes,
              quoteResponses: allResponses,
            });
          }
        } catch (error) {}
      },

      fetchQuoteDetails: async (quoteId) => {
        try {
          const quoteService = (await import("../services/quoteService"))
            .default;
          const response = await quoteService.getQuote(quoteId);
          if (response.success) {
            const { mapQuote } = await import("../utils/dataMappers");
            const mappedQuote = mapQuote(response.data);

            // Extract responses
            const quoteResponses = [];
            if (mappedQuote.responses && Array.isArray(mappedQuote.responses)) {
              mappedQuote.responses.forEach((r) => {
                quoteResponses.push({
                  ...r,
                  id: r._id || r.id,
                  quoteRequestId: mappedQuote.id,
                  provider: r.provider || { name: "Provider" },
                });
              });
            }

            set((state) => {
              // Update quote in quotes list
              const updatedQuotes = state.quotes.map((q) =>
                q.id === mappedQuote.id ? mappedQuote : q,
              );

              // If quote not in list (e.g. direct link), add it
              if (!state.quotes.find((q) => q.id === mappedQuote.id)) {
                updatedQuotes.push(mappedQuote);
              }

              // Update responses: Remove old responses for this quote and add new ones
              const otherResponses = state.quoteResponses.filter(
                (r) => r.quoteRequestId !== mappedQuote.id,
              );

              return {
                quotes: updatedQuotes,
                quoteResponses: [...otherResponses, ...quoteResponses],
              };
            });

            return mappedQuote;
          }
        } catch (error) {}
      },
      createQuote: (quoteData) => {
        const id = generateId("QT");
        const year = new Date().getFullYear();
        const count = get().quotes.length + 1;
        const reference = `Q-${year}-${count.toString().padStart(5, "0")}`;

        const newQuote = {
          id,
          reference,
          customerId: get().user.id,
          createdAt: new Date().toISOString(),
          status: "Open",
          vehicle: {
            make: quoteData.vehicleMake,
            model: quoteData.vehicleModel,
            year: parseInt(quoteData.vehicleYear),
          },
          serviceType: quoteData.serviceType,
          glassType: quoteData.glassType,
          location: {
            city: quoteData.city,
            postcode: quoteData.postcode || "",
            addressLine1: quoteData.addressLine1 || "",
            coordinates: quoteData.coordinates || null,
          },
          preferredDate: quoteData.preferredDate || null,
          preferredTimeSlot: quoteData.preferredTimeSlot || "Any time",
          notes: quoteData.notes || "",
          images: quoteData.images || [],
          responsesCount: 0,
        };

        set((state) => ({
          quotes: [newQuote, ...state.quotes],
        }));

        // Add activity
        get().addActivity({
          type: "quote_submitted",
          message: `New quote request ${reference} submitted`,
          relatedId: id,
        });

        get().addToast({
          type: "success",
          message: "Quote request sent successfully!",
        });
        return id;
      },

      closeQuoteRequest: async (quoteId) => {
        try {
          const quoteService = (await import("../services/quoteService"))
            .default;
          const response = await quoteService.cancelQuote(quoteId);

          if (response.success) {
            set((state) => ({
              quotes: state.quotes.map((q) =>
                q.id === quoteId ? { ...q, status: "Cancelled" } : q,
              ),
            }));
            get().addToast({
              type: "success",
              message: "Quote request closed successfully",
            });
            return true;
          } else {
            get().addToast({
              type: "error",
              message: response.message || "Failed to close quote request",
            });
            return false;
          }
        } catch (error) {
          get().addToast({
            type: "error",
            message: "An error occurred while closing the quote request",
          });
          return false;
        }
      },

      acceptQuote: async (quoteId, responseId) => {
        try {
          const quoteService = (await import("../services/quoteService"))
            .default;
          // Optimistically update local state if needed, or just wait for backend

          const result = await quoteService.acceptQuoteResponse(
            quoteId,
            responseId,
          );

          if (result.success) {
            // refresh data to reflect changes
            await get().fetchQuotes();
            await get().fetchBookings();

            get().addActivity({
              type: "quote_accepted",
              message: `Quote accepted! Booking created.`,
              relatedId: quoteId,
            });

            get().addToast({
              type: "success",
              message: "Quote accepted! Booking created.",
            });

            // Return the booking ID if available in response
            return result.data?.bookingId || result.data?._id;
          } else {
            get().addToast({
              type: "error",
              message: result.message || "Failed to accept quote",
            });
            return null;
          }
        } catch (error) {
          get().addToast({
            type: "error",
            message: "An error occurred while accepting the quote",
          });
          return null;
        }
      },

      // Note: closeQuoteRequest is defined above in Quote actions

      // Booking actions
      setBookings: (bookings) => set({ bookings }),
      fetchBookings: async () => {
        try {
          const bookingService = (await import("../services/bookingService"))
            .default;
          const response = await bookingService.getBookings();
          if (response.success) {
            const { mapBooking } = await import("../utils/dataMappers");
            const mappedBookings = response.data.map(mapBooking);
            set({ bookings: mappedBookings });
          }
        } catch (error) {}
      },
      confirmBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: "Confirmed",
              timeline: b.timeline.map((t, i) =>
                i <= 1
                  ? {
                      ...t,
                      completed: true,
                      date: t.date || new Date().toISOString(),
                    }
                  : t,
              ),
            };
          }),
        }));
        get().addActivity({
          type: "booking_confirmed",
          message: `Booking #${bookingId} confirmed`,
          relatedId: bookingId,
        });
        get().addToast({ type: "success", message: "Booking confirmed!" });
      },

      cancelBooking: (bookingId, reason) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: "Cancelled",
              cancellationReason: reason,
              timeline: [
                ...b.timeline.slice(0, 2),
                {
                  status: "Cancelled",
                  date: new Date().toISOString(),
                  completed: true,
                },
              ],
            };
          }),
        }));

        // Also update payment status
        const booking = get().bookings.find((b) => b.id === bookingId);
        if (booking) {
          set((state) => ({
            payments: state.payments.map((p) =>
              p.bookingId === bookingId && p.status === "Unpaid"
                ? {
                    ...p,
                    status: "Refunded",
                    refundDate: new Date().toISOString().split("T")[0],
                  }
                : p,
            ),
          }));
        }

        get().addActivity({
          type: "booking_cancelled",
          message: `Booking #${bookingId} was cancelled`,
          relatedId: bookingId,
        });
        get().addToast({ type: "info", message: "Booking cancelled" });
      },

      fetchBookingDetails: async (bookingId) => {
        try {
          const bookingService = (await import("../services/bookingService"))
            .default;
          const response = await bookingService.getBooking(bookingId);
          if (response.success) {
            const { mapBooking } = await import("../utils/dataMappers");
            const mappedBooking = mapBooking(response.data);

            set((state) => {
              // Update booking in bookings list
              const updatedBookings = state.bookings.map((b) =>
                b.id === mappedBooking.id ? mappedBooking : b,
              );

              // If booking not in list (e.g. direct link), add it
              if (!state.bookings.find((b) => b.id === mappedBooking.id)) {
                updatedBookings.push(mappedBooking);
              }

              return { bookings: updatedBookings };
            });

            return mappedBooking;
          }
        } catch (error) {
          console.error("Failed to fetch booking details:", error);
        }
      },

      completeBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: "Completed",
              timeline: b.timeline.map((t, i) =>
                i <= 3
                  ? {
                      ...t,
                      completed: true,
                      date: t.date || new Date().toISOString(),
                    }
                  : t,
              ),
            };
          }),
        }));
        get().addActivity({
          type: "booking_completed",
          message: `Booking #${bookingId} marked as completed`,
          relatedId: bookingId,
        });
        get().addToast({ type: "success", message: "Booking completed!" });
      },

      // Payment actions
      processPayment: async (paymentId, method) => {
        const payment = get().payments.find((p) => p.id === paymentId);
        if (!payment) return;

        // Optimistic update
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status: "Paid",
                  method,
                  date: new Date().toISOString().split("T")[0],
                }
              : p,
          ),
        }));

        // Update booking payment status and timeline locally
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== payment.bookingId) return b;
            return {
              ...b,
              paymentStatus: "Paid",
              timeline: b.timeline.map((t) =>
                t.status === "Payment Received"
                  ? { ...t, completed: true, date: new Date().toISOString() }
                  : t,
              ),
            };
          }),
        }));

        get().addActivity({
          type: "payment_completed",
          message: `Payment of ${formatCurrency(
            payment.amount,
          )} completed for booking ${payment.bookingRef}`,
          relatedId: paymentId,
        });

        // Persist to Backend
        try {
          const bookingService = (await import("../services/bookingService"))
            .default;
          if (payment.bookingId) {
            await bookingService.processBookingPayment(payment.bookingId, {
              paymentMethod: method,
              amount: payment.amount,
              paymentId: paymentId,
            });
          }
        } catch (error) {
          get().addToast({
            type: "error",
            message: "Connection error: Payment saved locally only.",
          });
          // We keep local state as "Paid" so user sees success, but warn them.
          // In real app, we might revert.
        }

        get().addToast({ type: "success", message: "Payment successful!" });
      },

      // Search & Booking flow actions
      setSearchCriteria: (criteria) => set({ searchCriteria: criteria }),

      searchProviders: (criteria) => {
        const providers = get().providers;
        // Uber Flow: Only show providers that are approved by admin
        let filtered = providers.filter((p) => p.isApproved);

        // Filter by city/location
        if (criteria?.city) {
          const cityLower = criteria.city.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.serviceAreas.some((area) =>
                area.toLowerCase().includes(cityLower),
              ) || p.address.city.toLowerCase().includes(cityLower),
          );
        }

        // Filter by service type if specified
        if (criteria?.serviceType) {
          filtered = filtered.filter((p) =>
            p.services.some(
              (s) =>
                s.name
                  .toLowerCase()
                  .includes(criteria.serviceType.toLowerCase()) ||
                s.name
                  .toLowerCase()
                  .includes(criteria.glassType?.toLowerCase() || ""),
            ),
          );
        }

        return filtered;
      },

      getProviderById: (providerId) => {
        return get().providers.find((p) => p.id === providerId);
      },

      getProviderReviews: (providerId) => {
        return get().reviews.filter((r) => r.providerId === providerId);
      },

      // Create booking from the booking flow
      createBookingFromFlow: (bookingData) => {
        const id = generateId("BK");
        const year = new Date().getFullYear();
        const count = get().bookings.length + 1;
        const reference = `B-${year}-${count.toString().padStart(5, "0")}`;

        const provider = get().providers.find(
          (p) => p.id === bookingData.providerId,
        );

        // Calculate prices
        const subtotal = bookingData.service.fromPrice;
        const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
        const total = subtotal + platformFee;

        const newBooking = {
          id,
          reference,
          source: "DirectBooking",
          customerId: get().user.id,
          providerId: bookingData.providerId,
          providerName: provider?.name || bookingData.providerName,
          providerType: provider?.type || "Business",
          providerPhone: provider?.phone || "",
          providerRating: provider?.rating || 0,
          providerReviews: provider?.reviewsCount || 0,
          vehicle: bookingData.vehicle,
          service: {
            id: bookingData.service.id,
            name: bookingData.service.name,
            fromPrice: bookingData.service.fromPrice,
            durationMins: bookingData.service.durationMins,
          },
          glassType: bookingData.glassType,
          scheduledDate: bookingData.scheduledDate,
          timeSlot: bookingData.timeSlot,
          address: bookingData.address,
          remarks: bookingData.remarks || "",
          uploadedImages: bookingData.uploadedImages || [],
          status: "Pending",
          paymentStatus: "Unpaid",
          price: {
            subtotal,
            platformFee,
            total,
          },
          timeline: [
            {
              status: "Request Sent",
              date: new Date().toISOString(),
              completed: true,
            },
            { status: "Provider Accepted", date: null, completed: false },
            { status: "Payment Completed", date: null, completed: false },
            { status: "Booking Confirmed", date: null, completed: false },
            { status: "Job Completed", date: null, completed: false },
          ],
          createdAt: new Date().toISOString(),
          acceptedAt: null,
          paidAt: null,
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
        }));

        get().addActivity({
          type: "booking_created",
          message: `Booking request ${reference} sent to ${provider?.name}`,
          relatedId: id,
        });

        get().addToast({
          type: "success",
          message: "Booking request sent successfully!",
        });
        return id;
      },

      // Simulate provider acceptance (for prototype demo)
      simulateProviderAcceptance: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: "Accepted",
              acceptedAt: new Date().toISOString(),
              timeline: b.timeline.map((t, i) =>
                i <= 1
                  ? {
                      ...t,
                      completed: true,
                      date: t.date || new Date().toISOString(),
                    }
                  : t,
              ),
            };
          }),
        }));

        get().addActivity({
          type: "booking_accepted",
          message: `Provider accepted booking #${bookingId}`,
          relatedId: bookingId,
        });

        get().addToast({
          type: "success",
          message: "Provider has accepted your booking!",
        });
      },

      // Process booking payment and confirm
      processBookingPayment: (bookingId, method) => {
        const booking = get().bookings.find((b) => b.id === bookingId);
        if (!booking) return;

        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status: "Confirmed",
              paymentStatus: "Paid",
              paidAt: new Date().toISOString(),
              timeline: b.timeline.map((t, i) =>
                i <= 3
                  ? {
                      ...t,
                      completed: true,
                      date: t.date || new Date().toISOString(),
                    }
                  : t,
              ),
            };
          }),
        }));

        // Create payment record
        const paymentId = generateId("PAY");
        const newPayment = {
          id: paymentId,
          bookingId,
          bookingRef: booking.reference || `REF-${bookingId}`,
          customerId: get().user.id,
          providerId: booking.providerId || "Provider",
          providerName: booking.providerName || "Provider",
          service: booking.service?.name || booking.service || "Go Service",
          amount: booking.price?.total || 0,
          breakdown: {
            service: booking.price?.subtotal || 0,
            platformFee: booking.price?.platformFee || 0,
          },
          status: "Paid",
          method,
          date: new Date().toISOString().split("T")[0],
        };

        set((state) => ({
          payments: [newPayment, ...state.payments],
        }));

        get().addActivity({
          type: "payment_completed",
          message: `Payment of ${formatCurrency(
            booking.price.total,
          )} for booking ${booking.reference}`,
          relatedId: bookingId,
        });

        get().addToast({
          type: "success",
          message: "Payment successful! Booking confirmed.",
        });
        return paymentId;
      },

      getBookingById: (bookingId) => {
        return get().bookings.find((b) => b.id === bookingId);
      },

      // Activity actions
      addActivity: (activity) => {
        const id = generateId("ACT");
        set((state) => ({
          activities: [
            { ...activity, id, timestamp: new Date().toISOString() },
            ...state.activities,
          ],
        }));
      },

      // Computed values
      getStats: () => {
        const state = get();

        const activeQuotes = state.quotes.filter(
          (q) => q.status === "Open" || q.status === "Received Responses",
        ).length;

        const upcomingBookings = state.bookings.filter(
          (b) =>
            b.status === "Confirmed" && new Date(b.scheduledDate) > new Date(),
        ).length;

        const completedJobs = state.bookings.filter(
          (b) => b.status === "Completed",
        ).length;

        const pendingPayments = state.payments.filter(
          (p) => p.status === "Unpaid",
        );
        const pendingPaymentsTotal = pendingPayments.reduce(
          (sum, p) => sum + p.amount,
          0,
        );

        return {
          activeQuotes,
          upcomingBookings,
          completedJobs,
          pendingPaymentsCount: pendingPayments.length,
          pendingPaymentsTotal,
        };
      },

      getBookingStatusCounts: () => {
        const bookings = get().bookings;
        return {
          pending: bookings.filter((b) => b.status === "Pending").length,
          accepted: bookings.filter((b) => b.status === "Accepted").length,
          confirmed: bookings.filter((b) => b.status === "Confirmed").length,
          completed: bookings.filter((b) => b.status === "Completed").length,
          cancelled: bookings.filter((b) => b.status === "Cancelled").length,
        };
      },

      getPaymentSummary: () => {
        const payments = get().payments;
        const unpaid = payments.filter((p) => p.status === "Unpaid");
        const pending = payments.filter((p) => p.status === "Pending");
        const paid = payments.filter((p) => p.status === "Paid");
        const refunded = payments.filter((p) => p.status === "Refunded");

        return {
          unpaid: {
            count: unpaid.length,
            total: unpaid.reduce((s, p) => s + p.amount, 0),
          },
          pending: {
            count: pending.length,
            total: pending.reduce((s, p) => s + p.amount, 0),
          },
          paid: {
            count: paid.length,
            total: paid.reduce((s, p) => s + p.amount, 0),
          },
          refunded: {
            count: refunded.length,
            total: refunded.reduce((s, p) => s + p.amount, 0),
          },
        };
      },

      getNextUpcomingBooking: () => {
        const bookings = get().bookings;
        const upcoming = bookings
          .filter(
            (b) =>
              b.status === "Confirmed" &&
              new Date(b.scheduledDate) > new Date(),
          )
          .sort(
            (a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate),
          );
        return upcoming[0] || null;
      },

      getQuoteResponses: (quoteId) => {
        return get().quoteResponses.filter((r) => r.quoteId === quoteId);
      },

      getQuotesNeedingAction: () => {
        return get().quotes.filter((q) => q.status === "Received Responses");
      },

      getUnpaidPayments: () => {
        return get().payments.filter((p) => p.status === "Unpaid");
      },

      // Message Actions
      setMessages: (messages) => set({ messages }),

      addMessage: (conversationId, message) => {
        set((state) => ({
          messages: state.messages.map((conv) => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              chatLog: [...conv.chatLog, message],
              lastMessage: message.text,
              lastMessageTime: message.time,
            };
          }),
        }));
      },

      createSupportTicket: (ticketData) => {
        const id = generateId("MSG");
        const newConversation = {
          id,
          type: "support",
          subject: ticketData.subject,
          preview: ticketData.description.substring(0, 50) + "...",
          lastMessage: ticketData.description,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          status: "open",
          participants: [
            { name: "Support Team", avatar: null, role: "admin" },
            { name: "Me", avatar: null, role: "customer" },
          ],
          chatLog: [
            {
              sender: "customer",
              text: ticketData.description,
              time: new Date().toISOString(),
              attachments: ticketData.attachments || [],
            },
          ],
        };

        set((state) => ({
          messages: [newConversation, ...state.messages],
        }));

        get().addActivity({
          type: "support_ticket_created",
          message: `Support ticket "${ticketData.subject}" created`,
          relatedId: id,
        });

        return id;
      },
    }),
    {
      name: "autoscreen-dashboard-v4",
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        searchCriteria: state.searchCriteria,
        // Exclude heavy data arrays (quotes, bookings, etc)
        // They should be fetched from API on load
      }),
    },
  ),
);

export default useDashboardStore;
