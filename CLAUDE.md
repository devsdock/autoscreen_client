# AutoScreen Customer Portal — Complete Workflow Guide (`clude.md`)

> **Project:** AutoScreen Customer Dashboard
> **Stack:** React + Vite, Zustand, React Router v6, Axios, Socket.IO
> **Version:** 1.0.0
> **Last Updated:** 23 March 2026 (Categorized Vehicle Image Upload)

---

## 🤖 SUBAGENT & AI ASSISTANT DIRECTIVES (MANDATORY)

_If you are an AI assistant or subagent reading this, you MUST unconditionally follow these rules before and during your task, even if the user forgets to mention them in their prompt:_

1. **Information Gathering Validation**:
   - ALWAYS carefully read `CLAUDE.md` and `ISSUES.md` within the relevant portal(s) before proposing or implementing _any_ changes. Understand the open blockers and the existing portal context first.
2. **Zero-Regression Principle**:
   - Ensure that any new update or feature **does NOT affect or break existing flows**. Existing functionality must remain perfectly intact (Backward Compatibility). Verify that neighboring components are not disrupted by your changes.

3. **Mandatory Testing & Verification**:
   - You MUST include test cases or validation steps in your implementation plan.
   - After implementing code in the portals, you must actively verify the application still builds (e.g., `npm run build`), deduce what functional tests need to be done based on your changes, and actively verify the UI state/components if required.

4. **Self-Updating Documentation**:
   - If a flow, architecture, or workflow changes during your implementation, you MUST automatically update the corresponding `CLAUDE.md` file to reflect these changes.
   - If you resolve or work on a known bug/feature, you MUST automatically update `ISSUES.md` (mark it as FIXED, or update the status) without waiting for the user to tell you.

---

## 📋 Table of Contents

1. [Portal Overview](#1-portal-overview)
2. [Authentication Workflow](#2-authentication-workflow)
3. [Book a Service Workflow](#3-book-a-service-workflow)
4. [Quotes Workflow](#4-quotes-workflow)
5. [Bookings Management Workflow](#5-bookings-management-workflow)
6. [Payments Workflow](#6-payments-workflow)
7. [Profile Management Workflow](#7-profile-management-workflow)
8. [Messages & Chat Workflow](#8-messages--chat-workflow)
9. [Support Tickets Workflow](#9-support-tickets-workflow)
10. [Notifications Workflow](#10-notifications-workflow)
11. [State Management Architecture](#11-state-management-architecture)
12. [API Service Layer](#12-api-service-layer)
13. [Route Map](#13-route-map)
14. [File & Folder Structure](#14-file--folder-structure)

---

## 1. Portal Overview

AutoScreen Customer Portal is a React-based SPA (Single Page Application) where customers can:

- Book auto glass services (windscreen replacement, repairs, etc.)
- Get and manage quotes from providers
- Track their bookings in real-time
- Process payments via Paystack
- Chat with providers
- Manage their profile and vehicle details

### Technology Stack

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| Framework         | React 18 + Vite                      |
| Routing           | React Router v6                      |
| State Management  | Zustand (with `persist` middleware)  |
| API Communication | Axios (via custom `request` wrapper) |
| Real-time         | Socket.IO Client                     |
| Payments          | Paystack.js                          |
| Styling           | TailwindCSS v3 + Custom CSS              |
| Icons             | Lucide React                              |

---

## 2. Authentication Workflow

### Flow Overview

```
[User Visits Portal]
       │
       ▼
[Check localStorage for token]
       │
   ┌───┴───────────────┐
   │                   │
[Token Found]    [No Token Found]
   │                   │
   ▼                   ▼
[Trust token +   [Redirect to Auth Portal]
 Validate in     (autoscreen_web /auth)
 background]
   │
   ▼
[Dashboard Loads]
```

### Key Actions in `useAuthStore.js`

| Action                        | Description                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `initAuth()`                  | Reads token from `localStorage`, validates via `/customer/auth/me`, sets state                            |
| `validateTokenInBackground()` | Non-blocking background re-validation; updates user data silently                                         |
| `logout()`                    | Calls `/customer/auth/logout`, clears ALL localStorage/sessionStorage keys, hard-redirects to auth portal |
| `clearAuth()`                 | Resets auth state (user, token, isAuthenticated) to null/false                                            |
| `setAuth(token, user)`        | Sets full auth state – used when token arrives via URL params (impersonation)                             |

### localStorage Keys Used

| Key                    | Purpose                           |
| ---------------------- | --------------------------------- |
| `autoscreen-token`     | JWT Auth token                    |
| `autoscreen-user`      | Cached user object (JSON)         |
| `autoscreen-userstate` | User preferences                  |
| `autoscreen-auth`      | Zustand persisted auth store      |
| `autoscreen-dashboard` | Zustand persisted dashboard store |

### Protected Routes

All `/dashboard/*` routes are wrapped in `<ProtectedRoute>` which checks `isAuthenticated` before rendering. Unauthenticated users are redirected to the auth portal.

### Special Route: Impersonation

- Route: `/impersonate`
- Component: `ImpersonatePage`
- Used by admins to log in as a customer. Receives token via URL/query params and calls `setAuth(token, user)`.

---

## 3. Book a Service Workflow

### Complete Journey

```
[Dashboard Sidebar: "Book a Service"]
              │
              ▼
   ┌──────────────────────┐
   │  BookSearch.jsx      │  /dashboard/book
   │  Fill search form:   │
   │  - Vehicle details   │
   │  - Glass type        │
   │  - Service type      │
   │  - Location          │
   └──────────┬───────────┘
              │ "Find Providers" clicked
              ▼
   ┌──────────────────────┐
   │  BookingForm.jsx     │  /dashboard/book/request
   │  Multi-step form:    │
   │  1. Service & Vehicle│
   │  2. Date & Time      │
   │  3. Address          │
   │  4. Remarks & Images │
   │  5. Review & Submit  │
   └──────────┬───────────┘
              │ "Send Booking Request" clicked
              ▼
   ┌──────────────────────┐
   │ BookingSearching.jsx │  /dashboard/booking/searching/:bookingId
   │ Real-time search     │
   │ Socket.IO polling    │
   │ Waiting for provider │
   └──────────┬───────────┘
              │ Provider accepted (quote received)
              ▼
   ┌──────────────────────┐
   │  BookingPending.jsx  │  /dashboard/booking/pending/:bookingId
   │  View accepted quote │
   │  Accept/Decline quote│
   │  "Pay Now" button    │
   └──────────┬───────────┘
              │ Customer pays
              ▼
   ┌──────────────────────┐
   │BookingConfirmation   │  /dashboard/booking/confirmation/:bookingId
   │  Success summary     │
   │  Reference number    │
   │  What's next info    │
   └──────────────────────┘
```

### BookSearch Form Fields

| Field           | Type                                 | Required |
| --------------- | ------------------------------------ | -------- |
| Vehicle Make    | Select                               | ✅       |
| Vehicle Model   | Text                                 | ✅       |
| Vehicle Year    | Select                               | ❌       |
| Glass Type      | Select (Windscreen/Side Window/etc.) | ✅       |
| Service Type    | Select (Repair/Replacement)          | ✅       |
| City / Location | Select or Geocoded Input             | ✅       |
| Postcode        | Text                                 | ❌       |

### BookingForm — 5-Step Stepper

```
[1. Service & Vehicle] → [2. Date & Time] → [3. Address] → [4. Remarks & Images] → [5. Review & Submit]
```

#### Step 1 — Service & Vehicle

- Confirm/change service type
- Vehicle make, model, year (pre-filled from search)
- Glass type (pre-filled)

#### Step 2 — Date & Time

- Calendar picker (future dates only)
- Time slot selection

#### Step 3 — Address

- Select from saved addresses (radio cards)
- "Add New Address" modal: Label, Line 1, City, Postcode

#### Step 4 — Remarks & Images

- Textarea for special instructions
- Drag-and-drop image upload (damage photos)
- Image preview thumbnails with remove button

#### Step 5 — Review & Submit

- Full booking summary
- Price breakdown: Subtotal + Platform Fee (5%) = **Total**
- "Send Booking Request" CTA

### Broadcast Booking API Calls

| Method | Endpoint                           | Purpose                            |
| ------ | ---------------------------------- | ---------------------------------- |
| `POST` | `/customer/bookings`               | Create booking request (broadcast) |
| `POST` | `/customer/bookings/upload-images` | Upload damage photos               |
| `GET`  | `/customer/bookings/:id/status`    | Poll booking status                |
| `POST` | `/customer/bookings/:id/quote`     | Accept/decline provider quote      |
| `POST` | `/customer/bookings/:id/payment`   | Process payment                    |
| `GET`  | `/customer/bookings/:id/invoice`   | Download invoice (blob)            |

### Real-time Searching (Socket.IO)

The `BookingSearching` page uses Socket.IO to listen for provider acceptance events:

- Connects to socket on mount
- Listens for `booking:provider_accepted` or similar events
- Falls back to polling via `getBookingStatus()` if socket fails
- Redirects to `/booking/pending/:id` on acceptance

---

## 4. Quotes Workflow

### Flow (Quote-Only Platform — March 2026)

> **Note:** The platform is now quote-only. "Book Now" / "Booking Request" menus are hidden in the sidebar.

```
[Dashboard: "Request Quotes" section]
         │
         ▼
[QuotesNew.jsx] /dashboard/quotes
  - Tabbed list: Open / Responses / Accepted / Closed
  - "Payment Due" amber pill on accepted quotes awaiting payment
  - Sidebar badge counts both Responses AND payment-due accepted quotes
         │ "Request a Quote" button
         ▼
[NewQuote.jsx] /dashboard/quotes/new
  - Multi-service, multi-glass selection
  - City coverage validation
  - Photo upload (mandatory)
         │ Quote submitted
         ▼
[QuoteDetailPage.jsx] /dashboard/quotes/:id
  - View provider responses
  - Accept provider quote → PaymentModal opens
  - Pay via Paystack
         │ Payment successful
         ▼
[BookAppointment.jsx] /dashboard/quotes/:id/book-appointment
  - Visual calendar with availability dots
  - Time slot selection (3-column grid)
  - Confirm appointment → booking confirmed
         │ Appointment confirmed
         ▼
[Bookings.jsx] /dashboard/bookings
  - Booking now visible in Upcoming tab
```

### Quote States

| Status      | Description                     |
| ----------- | ------------------------------- |
| `Open`      | Awaiting provider responses     |
| `Responses` | Providers have submitted quotes |
| `Accepted`  | Customer accepted a quote       |
| `Closed`    | Quote cancelled or expired      |

### Quote API Calls

| Method | Endpoint                       | Purpose                         |
| ------ | ------------------------------ | ------------------------------- |
| `GET`  | `/customer/quotes`             | List all quotes                 |
| `POST` | `/customer/quotes`             | Create new quote request        |
| `GET`  | `/customer/quotes/:id`         | Get single quote                |
| `POST` | `/customer/bookings/:id/quote` | Accept/decline a provider quote |

---

## 5. Bookings Management Workflow

### Overview

The `Bookings.jsx` page lists all customer bookings with filtering and detail view.

### Route Structure

| Route                             | Purpose                                   |
| --------------------------------- | ----------------------------------------- |
| `/dashboard/bookings`             | List all bookings                         |
| `/dashboard/bookings/:id`         | View booking detail                       |
| `/dashboard/bookings/:id/:action` | Perform action (e.g., reschedule, cancel) |

### Booking Status Lifecycle

```
Searching → Pending → Accepted → Confirmed → InProgress → Completed
                  ↘ Declined                          ↘ Cancelled
```

### Booking Actions Available to Customer

| Action                 | Condition                    | API Endpoint                                    |
| ---------------------- | ---------------------------- | ----------------------------------------------- |
| Cancel booking         | Status ≠ Completed/Cancelled | `PUT /customer/bookings/:id/cancel`             |
| Reschedule             | Status = Accepted/Confirmed  | `PUT /customer/bookings/:id/reschedule`         |
| Add review             | Status = Completed           | `POST /customer/bookings/:id/review`            |
| Get cancellation quote | Before cancelling            | `GET /customer/bookings/:id/cancellation-quote` |
| Download invoice       | Status = Confirmed/Completed | `GET /customer/bookings/:id/invoice`            |

### Booking Filters

- Status filter: All / Pending / Confirmed / Completed / Cancelled
- Type filter (service type)
- Pagination: page & limit params

### Booking Data Model

```javascript
{
  id: "BK-XXXXXXXX",
  reference: "B-2026-00007",
  customerId: "USR-001",
  providerId: "PRV-010",
  providerName: "Mike's Mobile Glass",
  vehicle: { make, model, year },
  service: { id, name, price, durationMins },
  glassType: "Windscreen",
  scheduledDate: "2026-02-20",
  timeSlot: "08:00-09:30",
  serviceAddress: { label, line1, city, postcode, coordinates },
  remarks: "...",
  damageImages: ["url1", "url2"],
  bookingStatus: "Pending|Accepted|Confirmed|Completed|Cancelled",
  paymentStatus: "Unpaid|Pending|Paid|Refunded",
  price: { subtotal, platformFee, total },
  createdAt: "ISO timestamp",
  acceptedAt: "ISO timestamp",
  paidAt: "ISO timestamp",
  paymentMethod: "card|eft|cash",
  timeline: [
    { status: "Booking Requested", date: "...", completed: true },
    // ...
  ]
}
```

---

## 6. Payments Workflow

### Overview

`Payments.jsx` shows all payment transactions for the customer.

### Route Structure

| Route                     | Purpose               |
| ------------------------- | --------------------- |
| `/dashboard/payments`     | List all transactions |
| `/dashboard/payments/:id` | View payment detail   |

### Payment Methods Supported

| Method | Description                      |
| ------ | -------------------------------- |
| `card` | Credit/Debit card (via Paystack) |
| `eft`  | EFT Bank Transfer                |
| `cash` | Cash on Service Day              |

### Payment Flow (In-Booking)

```
[Booking accepted by provider]
         │
         ▼
["Pay Now — R X,XXX" button shown]
         │
         ▼
[Payment Modal opens]
  - Shows price breakdown
  - User selects payment method
  - Card: Enter card details (Stripe)
  - EFT: Show bank details
  - Cash: Confirm cash payment intent
         │ "Pay R X,XXX" clicked
         ▼
[POST /customer/bookings/:id/payment]
         │ Success
         ▼
[bookingStatus = "Confirmed", paymentStatus = "Paid"]
         │
         ▼
[Redirect → /dashboard/booking/confirmation/:id]
```

### Payment API Calls

| Method | Endpoint                         | Purpose                 |
| ------ | -------------------------------- | ----------------------- |
| `GET`  | `/customer/payments`             | List all payments       |
| `GET`  | `/customer/payments/:id`         | Get payment detail      |
| `POST` | `/customer/bookings/:id/payment` | Process booking payment |

---

## 7. Profile Management Workflow

### Overview

`Profile.jsx` handles all customer profile settings: personal info, vehicle management, saved addresses, notification preferences.

### Route Structure

| Route                     | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `/dashboard/profile`      | View profile                             |
| `/dashboard/profile/edit` | Edit profile (same component, edit mode) |

### Profile Sections

| Section                  | Fields                                          |
| ------------------------ | ----------------------------------------------- |
| Personal Info            | Name, Email, Phone, Profile Photo               |
| Vehicles                 | Make, Model, Year — add/edit/remove             |
| Saved Addresses          | Label, Line 1, City, Postcode — add/edit/remove |
| Notification Preferences | Email / SMS / Push toggles                      |
| Security                 | Change Password                                 |

### Profile API Calls (via `profileService.js`)

| Method   | Endpoint                          | Purpose                          |
| -------- | --------------------------------- | -------------------------------- |
| `GET`    | `/customer/profile`               | Fetch profile data               |
| `PUT`    | `/customer/profile`               | Update profile                   |
| `POST`   | `/customer/profile/photo`         | Upload profile photo (multipart) |
| `PUT`    | `/customer/profile/password`      | Change password                  |
| `POST`   | `/customer/profile/vehicles`      | Add vehicle                      |
| `PUT`    | `/customer/profile/vehicles/:id`  | Update vehicle                   |
| `DELETE` | `/customer/profile/vehicles/:id`  | Remove vehicle                   |
| `POST`   | `/customer/profile/addresses`     | Add address                      |
| `PUT`    | `/customer/profile/addresses/:id` | Update address                   |
| `DELETE` | `/customer/profile/addresses/:id` | Remove address                   |

---

## 8. Messages & Chat Workflow

### Overview

`Messages.jsx` provides in-app chat between customer and their assigned provider for a booking.

### Route

| Route                 | Purpose                            |
| --------------------- | ---------------------------------- |
| `/dashboard/messages` | Messages inbox / conversation list |

### Chat Flow

```
[Customer has confirmed booking]
         │
         ▼
[Messages tab shows conversation with provider]
         │
         ▼
[Real-time chat via Socket.IO (chatService.js)]
  - Customer sends message
  - Provider receives and replies
  - Messages persisted on backend
```

### Chat Service (`chatService.js`)

| Event / Method                         | Purpose                      |
| -------------------------------------- | ---------------------------- |
| `connect()`                            | Connect to Socket.IO server  |
| `sendMessage(conversationId, message)` | Emit message event           |
| `onMessage(callback)`                  | Listen for incoming messages |
| `disconnect()`                         | Clean up socket connection   |

---

## 9. Support Tickets Workflow

### Overview

`Support.jsx` allows customers to open and manage support tickets.

### Route

| Route                | Purpose                         |
| -------------------- | ------------------------------- |
| `/dashboard/support` | Support tickets list & creation |

### Support Flow

```
[Customer encounters issue]
         │
         ▼
["Open New Ticket" button]
  - Subject
  - Category (Billing / Technical / Booking / Other)
  - Description
  - Attachments (optional)
         │
         ▼
[POST /customer/support] (via supportTicketService.js)
         │
         ▼
[Ticket appears in list with status "Open"]
         │
         ▼
[Admin responds → status updates]
  - Open → In Progress → Resolved → Closed
```

### Ticket Statuses

| Status        | Description            |
| ------------- | ---------------------- |
| `Open`        | Newly submitted        |
| `In Progress` | Admin is investigating |
| `Resolved`    | Issue fixed            |
| `Closed`      | Ticket archived        |

---

## 10. Notifications Workflow

### Overview

`useNotificationStore.js` manages in-app notifications (toast alerts, notification bell).

### Notification Triggers

| Trigger                      | Notification Type    |
| ---------------------------- | -------------------- |
| Booking accepted by provider | Success toast + bell |
| Quote received from provider | Info toast + bell    |
| Payment confirmed            | Success toast        |
| Booking cancelled            | Warning toast        |
| Support ticket update        | Info bell            |
| New message from provider    | Info toast + bell    |

### Notification Store Actions

| Action                           | Description               |
| -------------------------------- | ------------------------- |
| `addNotification(message, type)` | Push new notification     |
| `markRead(id)`                   | Mark notification as read |
| `markAllRead()`                  | Clear unread count        |
| `clearNotifications()`           | Remove all notifications  |

---

## 11. State Management Architecture

### Zustand Stores

| Store File                | Persisted | Purpose                                         |
| ------------------------- | --------- | ----------------------------------------------- |
| `useAuthStore.js`         | ✅ Yes    | Auth token, user object, isAuthenticated        |
| `useDashboardStore.js`    | ✅ Yes    | Bookings, quotes, payments, addresses, vehicles |
| `useNotificationStore.js` | ❌ No     | In-app notification queue                       |
| `useSettingsStore.js`     | ❌ No     | Public portal settings (maintenance mode, etc.) |
| `useStore.js`             | ❌ No     | UI/global ephemeral state                       |

### `useDashboardStore.js` — Key Actions

```javascript
// Booking actions
createBooking(data); // POST /customer/bookings
fetchBookings(params); // GET /customer/bookings
fetchBooking(bookingId); // GET /customer/bookings/:id
cancelBooking(bookingId, reason); // PUT /customer/bookings/:id/cancel
processBookingPayment(id, data); // POST /customer/bookings/:id/payment

// Quote actions
fetchQuotes(); // GET /customer/quotes
createQuote(data); // POST /customer/quotes
respondToQuote(id, providerId, action); // POST /customer/bookings/:id/quote

// Profile actions
fetchProfile(); // GET /customer/profile
updateProfile(data); // PUT /customer/profile
addVehicle(data); // POST /customer/profile/vehicles
addAddress(data); // POST /customer/profile/addresses

// Dashboard overview
fetchDashboardData(); // GET /customer/dashboard
clearData(); // Reset all dashboard state (on logout)
```

### Data Persistence

Both `useAuthStore` and `useDashboardStore` use Zustand's `persist` middleware, saving to `localStorage` under:

- `autoscreen-auth`
- `autoscreen-dashboard`

---

## 12. API Service Layer

### Base Configuration (`api.js`)

```javascript
// Base URL from environment
const BASE_URL = import.meta.env.VITE_API_URL;

// Auth token auto-attached from localStorage
// Error handling: 401 → clear auth + redirect to login
```

### Service Files

| File                       | Endpoints Covered                       |
| -------------------------- | --------------------------------------- |
| `bookingService.js`        | `/customer/bookings/*`                  |
| `quoteService.js`          | `/customer/quotes/*`                    |
| `paymentService.js`        | `/customer/payments/*`                  |
| `profileService.js`        | `/customer/profile/*`                   |
| `vehicleService.js`        | Vehicle make/model/year lookup          |
| `dashboardService.js`      | `/customer/dashboard` overview data     |
| `geocodingService.js`      | Address → coordinates (Google Maps API) |
| `publicSettingsService.js` | `/settings/*` (maintenance mode, etc.)  |
| `socketService.js`         | Socket.IO connection management         |
| `chatService.js`           | Real-time chat via Socket.IO            |
| `supportTicketService.js`  | `/customer/support/*`                   |

---

## 13. Route Map

```
/                           → Redirect to /dashboard
/impersonate                → ImpersonatePage (admin use)

/dashboard                  → DashboardLayout (Protected)
  /                         → OverviewNew.jsx (dashboard home)
  /quotes                   → QuotesNew.jsx (tabbed list view)
  /quotes/new               → NewQuote.jsx (request form)
  /quotes/:id               → QuoteDetailPage.jsx (detail wrapper)
  /quotes/:id/book-appointment → BookAppointment.jsx (post-payment scheduling)
  /bookings                 → Bookings.jsx
  /bookings/:id             → Bookings.jsx (detail mode)
  /bookings/:id/:action     → Bookings.jsx (action mode)
  /payments                 → Payments.jsx
  /payments/:id             → Payments.jsx (detail)
  /vehicles                 → Vehicles.jsx (vehicle management)
  /insurance                → Insurance.jsx (placeholder)
  /profile                  → Profile.jsx
  /profile/edit             → Profile.jsx (edit mode)
  /support                  → Support.jsx
  /messages                 → Messages.jsx

*                           → Redirect to /dashboard
```

---

## 14. File & Folder Structure

```
autoscreen_client/
├── public/                        # Static assets
├── docs/
│   └── BOOK_A_SERVICE_WORKFLOW.md # Detailed booking flow docs
├── src/
│   ├── App.jsx                    # Router config
│   ├── main.jsx                   # App entry point
│   ├── index.css                  # Global styles
│   │
│   ├── assets/                    # Images, icons
│   │
│   ├── components/                # Reusable UI components
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.jsx     # Main layout wrapper
│   │   │   ├── DashboardSidebar.jsx    # Left nav with badge counts
│   │   │   ├── DashboardTopBar.jsx     # Header with notifications
│   │   │   ├── BookingDetailDrawer.jsx # Booking detail side panel
│   │   │   ├── QuoteDetailPanel.jsx    # Quote detail with responses
│   │   │   ├── BookingCard.jsx         # Booking list card (redesigned)
│   │   │   ├── ProviderResponseCard.jsx # Provider quote response card
│   │   │   ├── PaymentModal.jsx        # Payment processing modal
│   │   │   ├── SelectSlotModal.jsx     # Date/time slot selector
│   │   │   ├── RequestQuoteModal.jsx   # Quote request modal
│   │   │   ├── ReviewModal.jsx         # Booking review modal
│   │   │   └── DashboardRightSidebar.jsx # Right panel (future use)
│   │   ├── ui/                    # 26 reusable UI primitives
│   │   │   ├── Button.jsx, Card.jsx, Modal.jsx, Drawer.jsx
│   │   │   ├── Input.jsx, Textarea.jsx, Select.jsx
│   │   │   ├── PremiumSelect.jsx, PremiumDatePicker.jsx
│   │   │   ├── Tabs.jsx, Badge.jsx, StatusBadge.jsx
│   │   │   ├── Avatar.jsx, Skeleton.jsx, Toast.jsx
│   │   │   ├── Tooltip.jsx, Accordion.jsx, AlertBanner.jsx
│   │   │   ├── ConfirmModal.jsx, EmptyState.jsx
│   │   │   ├── PageHeader.jsx, StatCard.jsx, Rating.jsx
│   │   │   └── ServiceInfoCell.jsx
│   │   ├── skeletons/             # Loading skeletons (4 files)
│   │   ├── layout/                # Layout wrappers
│   │   ├── chat/                  # SupportChatPopup.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx          # (legacy/base)
│   │   ├── MaintenancePage.jsx
│   │   ├── Settings.jsx
│   │   ├── Users.jsx
│   │   ├── auth/
│   │   │   └── ImpersonatePage.jsx
│   │   └── dashboard/
│   │       ├── OverviewNew.jsx      # Dashboard home (greeting, stats)
│   │       ├── Bookings.jsx         # My bookings list & detail
│   │       ├── QuotesNew.jsx        # Quotes list (tabbed, redesigned)
│   │       ├── NewQuote.jsx         # Quote request form
│   │       ├── QuoteDetailPage.jsx  # Quote detail routing wrapper
│   │       ├── BookAppointment.jsx  # Post-payment appointment scheduling
│   │       ├── Payments.jsx         # Payment history
│   │       ├── Vehicles.jsx         # Vehicle add/edit/delete
│   │       ├── Insurance.jsx        # Placeholder insurance page
│   │       ├── Profile.jsx          # Profile + vehicles + addresses
│   │       ├── Messages.jsx         # Chat with provider
│   │       └── Support.jsx          # Support tickets
│   │
│   ├── services/                  # API service layer
│   │   ├── api.js                 # Base Axios config + request wrapper
│   │   ├── bookingService.js
│   │   ├── quoteService.js
│   │   ├── paymentService.js
│   │   ├── profileService.js
│   │   ├── vehicleService.js
│   │   ├── dashboardService.js
│   │   ├── geocodingService.js
│   │   ├── publicSettingsService.js
│   │   ├── socketService.js
│   │   ├── chatService.js
│   │   └── supportTicketService.js
│   │
│   ├── store/                     # Zustand state management
│   │   ├── useAuthStore.js        # Auth state
│   │   ├── useDashboardStore.js   # Bookings, quotes, payments, profile
│   │   ├── useNotificationStore.js # Notifications
│   │   ├── useSettingsStore.js    # Portal settings
│   │   └── useStore.js            # Global UI state
│   │
│   ├── data/                      # Static / mock data (14 files)
│   │   ├── providers.js
│   │   ├── reviews.js
│   │   ├── addresses.js
│   │   └── ...
│   │
│   ├── utils/                     # Helper functions (5 files)
│   └── config/                    # App config (1 file)
│
├── .env                           # Environment variables
├── vite.config.js
├── package.json
└── clude.md                       # ← This file
```

---

## Environment Variables (`.env`)

| Variable                   | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `VITE_API_URL`             | Backend API base URL                     |
| `VITE_AUTH_WEB_URL`        | Auth portal URL (for redirect on logout) |
| `VITE_SOCKET_URL`          | Socket.IO server URL                     |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack publishable key                 |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (geocoding)          |
| `VITE_TINYMCE_API_KEY`     | TinyMCE key (email editor)               |

---

## Multi-Select Feature Test Cases

To verify the multi-select implementation in `BookingForm.jsx`:

1.  **Single Selection Verification**:
    - Select one service (e.g., "Glass Replacement") and one glass type (e.g., "Windscreen").
    - Verify selection is stored in `serviceSelections`.
    - Submit and verify payload has `serviceSelections: [{ serviceName: "Glass Replacement", glassTypes: ["Windscreen"] }]`.

2.  **Multi-Selection Grouping Verification**:
    - Select "Glass Replacement" and "Glass Repair".
    - Assign "Windscreen" to Replacement and "Side Window" to Repair.
    - Verify the UI summary shows the correct grouping.
    - Submit and verify payload maintains this grouping in `serviceSelections`.

3.  **Zero-Regression Verification**:
    - Ensure existing flow for single-service selection still works perfectly.
    - Verify that `serviceTypes` and `glassTypes` arrays are still populated for backward compatibility with legacy reporting.

---

## Changelog

### 23 March 2026 (City Validation Restored — C-031)

- **`NewQuote.jsx` — Step 3 + final validation blocks disabled/unknown cities**: Both `validateStep` (step 3) and `validate()` now check if the selected city exists in the cities list AND is not disabled (no providers). Previously only checked `!formData.city` (empty string). Non-SA cities and "coming soon" cities are now rejected with "No providers available in this area yet".
- **`NewQuote.jsx` — "Use My Location" no longer sets disabled/unknown cities**: After reverse geocoding, if the matched city has no providers or isn't in the SA city list, `formData.city` is set to empty string instead of the invalid city name. Error messages: "No providers available in this area yet" (disabled SA city) or "Could not determine a serviceable city from your location" (non-SA/unmatched).

### 23 March 2026 (BookAppointment Calendar — Prefetch Loading Fix)

- **`BookAppointment.jsx` — Calendar loading overlay**: Added `isPrefetching` state to track when `prefetchMonth` is fetching availability data. CalendarPicker now shows a spinner overlay ("Loading availability...") while prefetch is running and cache is empty. Prevents the "no dates available" appearance on first load before availability data arrives.
- **`BookAppointment.jsx` — `prefetchMonth` wrapped in try/finally**: `setIsPrefetching(true)` at start, `setIsPrefetching(false)` in `finally` block — ensures cleanup even on errors.
- **Root cause**: On first page visit, `providerId` is derived from quote data loaded async. Calendar rendered immediately after quote load but before the ~1.5s prefetch completed, showing empty dots. On refresh, Zustand cache provided quote instantly, masking the race condition.

### 23 March 2026 (Categorized Vehicle Image Upload)

- **`NewQuote.jsx` + `RequestQuoteModal.jsx` — Categorized image upload**: Replaced the single generic "Upload Photos" drag zone with 3 categorized upload slots: **Front of Vehicle** (single, `Car` icon), **VIN / Licence Disc** (single, `ScanLine` icon), and **Damaged Area** (multi, `Camera` icon). All 3 categories required before submission.
- **New component `ImageUploadSlot.jsx`**: Reusable upload slot component at `components/ui/ImageUploadSlot.jsx`. Supports single-image mode (with replace/remove) and multi-image mode (with thumbnail grid). Dark mode compatible.
- **State change**: `formData.images[]` replaced with `formData.vehicleImages: { frontView, vinLicenceDisc, damagePhotos[] }`.
- **Zero backend risk**: All categories are flattened into the existing `damageImages[]` array on submission. No backend, admin, or provider portal changes needed.
- **Validation**: Per-category error messages instead of generic "At least one photo is required".
- **Modal reset**: `RequestQuoteModal` properly resets `vehicleImages` on open and after submission.

### 20 March 2026 (Mobile Responsiveness Audit & Fix — Full Portal)

Design-only Tailwind class changes across 15 files. No logic, API, or functionality changes.

**Shared UI Components (Phase 1):**
- **`Card.jsx`**: Default padding `p-6` → `p-4 sm:p-6` for better 320px viewport fit.
- **`Modal.jsx` — `ModalActions`**: Buttons now stack vertically on mobile (`flex-col-reverse sm:flex-row`) — primary action on top, cancel below.
- **`Drawer.jsx` — `DrawerFooter`**: Buttons stack vertically on mobile (`flex-col sm:flex-row`).
- **`Tabs.jsx`**: Outer container wrapped in `overflow-x-auto` with `-webkit-overflow-scrolling: touch` for horizontal tab scrolling on mobile. Tab buttons get `flex-shrink-0`.
- **`StatCard.jsx`**: Value text `text-3xl` → `text-2xl sm:text-3xl`.

**Dashboard Components (Phase 2):**
- **`BookingDetailDrawer.jsx`**: Image grids (`damageImages`, `afterImages`) changed from `grid-cols-3 sm:grid-cols-4` → `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`. Footer action button grid changed from `grid-flow-col auto-cols-fr` → `grid-cols-1 sm:grid-cols-2` to stack on mobile.

**Dashboard Pages (Phase 3):**
- **`OverviewNew.jsx`**: Hero padding `py-8 px-10` → `py-6 sm:py-8 px-4 sm:px-10`. Action buttons stack vertically on mobile (`flex-col sm:flex-row`).
- **`Overview.jsx`**: History table hidden on mobile (`hidden lg:block`), replaced with mobile card list (`lg:hidden`). All custom card divs padding `p-6` → `p-4 sm:p-6`.
- **`QuotesNew.jsx`**: Quote card footer `flex items-center justify-between` → `flex-col sm:flex-row sm:items-center sm:justify-between gap-2`.
- **`Profile.jsx`**: Gradient header padding `p-7` → `p-5 sm:p-7`. Address modal suburb/city grid `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`. Vehicle modal year/body-type grid same fix.
- **`Vehicles.jsx`**: Vehicle modal year/body-type grid `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`. Card header height `h-[140px]` → `h-[100px] sm:h-[140px]`.
- **`Messages.jsx`**: Container height uses `100dvh` (dynamic viewport height) for mobile browser chrome. Image attach button hidden on mobile (`hidden sm:block`). Message bubble max-width `max-w-[85%] sm:max-w-[75%] md:max-w-[70%]`.
- **`Support.jsx`**: Drag-drop zone padding `p-6` → `p-4 sm:p-6`.

### 20 March 2026 (BookingCard Mobile Responsive + Button Centering + Modal Z-Index)

- **`BookingCard.jsx`**: Footer restructured for mobile — price and buttons now stack vertically on mobile (`flex-col sm:flex-row`). Button container changed from horizontal-only `flex items-center gap-2` to `flex flex-col sm:flex-row` with `w-full sm:w-auto` on each button. All buttons get `justify-center` for centered text/icons when full-width. Handles 3-button scenarios (workshop bookings: Reschedule + Directions + Cancel, or Book Appointment + Directions + Cancel).
- **`OverviewNew.jsx`**: Hero buttons get `justify-center` for centered content when stacked full-width on mobile.
- **`QuotesNew.jsx`**: "View Quotes" footer span gets `justify-center`.
- **`ProviderResponseCard.jsx`**: "Accept & Pay" button gets `flex items-center justify-center` Tailwind classes (was only centered via inline styles).
- **`QuoteDetailPanel.jsx`**: "Book Appointment" and "View Booking" buttons get Tailwind centering classes.
- **`SupportChatPopup.jsx`**: Z-index lowered from `z-50` to `z-40` so modals/drawers (`z-50`) properly overlay the chat icon.
- **`Toast.jsx`**: Z-index raised from `z-50` to `z-[60]` so toast notifications remain visible above modals.

### 12 March 2026 (Dead Code Cleanup — Old Quote Acceptance Flow)

- **`useDashboardStore.js` — `acceptQuote` action removed**: Deleted the `acceptQuote` store action (~40 lines) that called the now-removed `acceptQuoteResponse` backend endpoint. The current flow uses `PaymentModal` → `initializeQuotePayment` directly.
- **`quoteService.js` — `acceptQuoteResponse` method removed**: Deleted the API method that called `POST /customer/quotes/:quoteId/accept/:responseId`.
- **`QuoteDetail.jsx` deleted**: Old quote detail page that used `acceptQuote` + `SelectSlotModal`. Not imported by any component or route — superseded by `QuoteDetailPanel.jsx` (used in `Quotes.jsx` and `QuoteDetailPage.jsx`).
- **`SelectSlotModal.jsx` deleted**: Date/time slot selector component only used by the deleted `QuoteDetail.jsx`. Scheduling now happens post-payment on `BookAppointment.jsx`.

### 11 March 2026 (Dead Code Removal + Cancel / Service Display Fixes)

- **`App.jsx`** — Removed 7 unused direct-booking page imports (BookSearch, ProviderList, ProviderProfile, BookingForm, BookingSearching, BookingPending, BookingConfirmation) and their 5 routes (`/book`, `/book/request`, `/booking/searching/:id`, `/booking/pending/:id`, `/booking/confirmation/:id`). Page files deleted from disk. Platform is quote-only; these routes were unreachable.
- **`utils/dataMappers.js`** — Added ObjectId regex guard (`/^[a-f\d]{24}$/i`) in `formatServiceName()`. Raw unpopulated ObjectId strings are now skipped and fallback to `serviceType` is used, fixing service name showing as a 24-char hex string in Bookings list and drawer.
- **`pages/dashboard/Bookings.jsx`** — Cancel now passes `"Customer requested cancellation"` as the reason to `bookingService.cancelBooking()`.

### 10 March 2026 (Profile — Default Location Removed)

- **`Profile.jsx` — Default Location section removed**: Removed the read-only "Default Location" row from the profile settings list. It was a non-editable duplicate of the default saved address info already visible in the Saved Addresses section above.

### 10 March 2026 (Mobile Responsive Round 2 — 320px Viewport Fixes)

- **Header duplicate buttons**: "Close Quote" text button now hidden below `sm` (640px) — only compact X button shows on mobile. Moved `display: "inline-flex"` from inline style to `hidden sm:inline-flex` Tailwind class.
- **ProviderResponseCard padding**: Moved padding from non-responsive inline styles to responsive Tailwind classes — Provider column: `p-3 sm:p-5`, Service column: `px-3 py-3 sm:px-4 sm:py-5`, Price column: `p-3 sm:p-[1.125rem]`. Recovers ~36px of content area at 320px.
- **Journey stepper**: Reduced horizontal padding `p-3` → `px-1.5 py-3` on mobile (reclaims 12px). Step labels hidden on mobile except the current active step (`hidden sm:block`, active step always `block`).
- **Context bar columns**: Changed from `min-w-0 flex-1` to `w-full sm:flex-1 sm:min-w-0` on Vehicle/Damage/Location columns — now stack vertically on mobile, 3-column row at 640px+.

### 10 March 2026 (Dark Mode + Mobile Responsive Fix — ProviderResponseCard, QuoteDetailPanel, Layout)

- **Dark mode fix**: Moved inline `color`, `background`, `border` properties from `style={{}}` to Tailwind classes with `dark:` variants on `ProviderResponseCard.jsx` (~30 elements) and `QuoteDetailPanel.jsx` (~10 elements). Inline styles for fonts/gradients/shadows remain unchanged.
- **Mobile responsive fix**: `DashboardLayout.jsx` main content padding reduced from `px-8 py-6` to `px-4 sm:px-8 py-4 sm:py-6`, recovering 32px at 320px viewport. Card layout stacks vertically below 640px via Tailwind responsive classes.
- **Dead CSS cleanup**: Removed ~180 lines of `.prc-*` and `.qdp-*` CSS rules from `index.css` that used `!important` but could never override inline `style={{}}` attributes (CSS spec limitation).
- **Pattern established**: Inline styles for fonts/gradients/shadows only; Tailwind classes for colors/backgrounds/borders (enables `dark:` variants).

### 10 March 2026 (BookAppointment — Available/Taken Slot Display)

- **`BookAppointment.jsx` — `TimeSlotsPanel`**: Updated to handle new `{ time, status }` slot objects returned by the backend. Renders "Available" slots (white, selectable) and "Taken" slots (grey, disabled). Backward-compatible with old string-only slot format.

### 9 March 2026 (BookingCard Price Format & Polish)

- **`BookingCard.jsx` — price display**: Whole numbers no longer show `.00` in the booking card footer (e.g., `R 2000` instead of `R 2000.00`). Decimals still shown when meaningful (e.g., `R 2000.10`). Uses local inline formatting — global `formatCurrency` unchanged so other pages (payments, invoices, cancellation fees) are not affected.
- **`BookingCard.jsx`**: Changed "paid" label to "Paid" (first letter capitalized).

### 9 March 2026 (Full Documentation Refresh)

- **Documentation**: Updated CLAUDE.md with all new pages (OverviewNew, QuotesNew, NewQuote, QuoteDetailPage, BookAppointment, Vehicles, Insurance), updated route map, component inventory, and file structure to reflect current codebase state.
- **Pages count**: 22 dashboard pages, 12 dashboard components, 26 UI components, 13 services, 5 stores.

### 15 March 2026 (Reschedule Booking Feature — Frontend)

- **`BookingCard.jsx`**: Added `canReschedule` flag (`isScheduled && category === "upcoming" && scheduledDate > 24h from now`). Renders an amber "Reschedule" button (with `RefreshCw` icon, already imported) between "Book Appointment" and "Cancel" buttons when condition is met.
- **`BookingDetailDrawer.jsx`**: Added `canReschedule` computed flag (same logic: `confirmed` status, `scheduledDate` present, `paid`, appointment >24h away). Added `RefreshCw` to lucide-react imports. Footer condition expanded to include `canReschedule`. Reschedule button added inside the grid section (before Cancel), navigates to `/dashboard/bookings/:id/reschedule` after closing the drawer.
- **`App.jsx`**: Added `<Route path="bookings/:id/reschedule" element={<BookAppointment />} />` placed BEFORE `bookings/:id/:action` so it takes priority.
- **`Bookings.jsx`**: Fixed `onReschedule` callback to navigate to `/dashboard/bookings/${b.id}/reschedule` (was incorrectly using `replace: true` and going to the booking ID without the path segment).
- **`BookAppointment.jsx`**: Full dual-mode support:
  - `useLocation` added to detect reschedule mode (`/bookings/*/reschedule` URL pattern).
  - `isReschedule` and `bookingIdFromUrl` flags derived from URL.
  - Existing quote-load `useEffect` wrapped with `if (isReschedule) return` guard.
  - New `useEffect` for reschedule mode: calls `bookingService.getBooking(bookingIdFromUrl)`, builds a minimal quote-like object from booking fields for display compatibility.
  - `handleConfirm` prioritises `bookingIdFromUrl` so reschedule path always uses the correct booking ID.
  - Back link, page title, and subtitle conditionally show reschedule copy.
  - `JourneyProgress` and `ProviderPaidBar` hidden in reschedule mode.
  - `ConfirmedModal` accepts `isReschedule` prop — shows "Appointment Rescheduled!" title and alternate subtitle.
  - `AppointmentSummary` accepts `isReschedule` prop — confirm button label changes to "Reschedule Appointment".

**Reschedule eligibility:**
- Booking status must be `confirmed`, payment status `paid`, and `scheduledDate` must be more than 24 hours in the future.
- Calls the existing `PUT /customer/bookings/:id/reschedule` endpoint (already in `bookingService.rescheduleBooking`).

### 9 March 2026 (BookingCard Design Matching Reference HTML + BookAppointment Confirmed Modal + Provider Reschedule Socket & Badge)

#### BookingCard Design Redesign
- **`BookingCard.jsx`**: Complete visual redesign to match reference HTML. Header gradient now green (`#15803D → #166534`) for scheduled cards (confirmed bookings with `scheduledDate`), blue for other upcoming statuses, slate for completed, gray for cancelled. Date format changed from `DD/MM/YYYY` to compact short format (`Tue 14 Jan`) via new `formatDateShort()` utility function. Provider phone number now displays (with Phone icon) when booking is paid and scheduled. Scheduled state shows semi-transparent white badge (`rgba(255,255,255,.15)`) instead of colored StatusBadge. Card layout: four info columns (Date & Time, Provider, Service Type, Location).
- **`BookingDetailDrawer.jsx`**: Updated StatusBadge to recognize and display "scheduled" state when `booking.status === "confirmed" && booking.scheduledDate` is present.
- **`StatusBadge.jsx`**: Added "Scheduled" status entry with blue styling to match new card design.

#### BookAppointment Confirmed Modal Refinements
- **`BookAppointment.jsx` — ConfirmedModal visual polish**: Info rows now wrapped in card containers (`bg-slate-50 border border-slate-100 rounded-lg`). User icon changed to Phone icon for "Provider will call you within 2 hours" line. Reduced spacing throughout: provider avatar 76→64px, title `text-2xl`→`text-xl`, body text 15→13px, padding `pt-10 pb-6`→`pt-7 pb-5`. Booking reference displayed as `inline-block`. CTA button padding reduced. Modal overlay no longer closes on outside click (removed onClick handler).

#### Provider Reschedule Support — Socket & Sidebar Badge
- **`socketService.js`**: Added `slot_change_proposed` and `schedule_accepted` event types to booking refresh handler — client bookings and quotes stores now properly refresh when provider proposes reschedule or accepts customer's counter-proposal.
- **`DashboardSidebar.jsx`**: "My Bookings" badge count now includes action-required items: bookings with `slotNegotiation.status === "provider-proposed"` where the customer must respond to provider's slot change proposal.
- **`DashboardTopBar.jsx`**: `slot_change_proposed` notifications without a `quoteId` now correctly route to `/dashboard/bookings/:bookingId` instead of quotes.

### 9 March 2026 (BookAppointment Page)

- **`BookAppointment.jsx`** (new): Post-payment appointment scheduling page at `/dashboard/quotes/:id/book-appointment`. Appears after Paystack payment succeeds.
- **Journey progress bar**: 6-step visual stepper (Sent → Providers → Reviewed → Paid → Book Appt [active] → Confirmed).
- **Provider Paid Bar**: Shows provider initials avatar, name, service + vehicle, amount with "Paid in full" badge.
- **Visual calendar** (built from scratch — no external library): Month grid with Mo–Su headers, past/today disabled, future dates with available slots get blue dot indicators, selected day highlighted blue.
- **14-day prefetch**: On mount the calendar fetches availability for the next 14 days concurrently (80ms delay between requests) to pre-populate slot dots before the user clicks a date.
- **Time slots panel**: 3-column grid, selected slot highlighted blue, loading spinner during fetch, empty-state messaging.
- **Availability caching**: Results from `quoteService.getProviderAvailability()` cached in `availabilityCache` state keyed by `YYYY-MM-DD` — re-selecting the same date does not re-fetch.
- **Appointment Summary card**: Appears after both date + slot selected. Shows Date, Time, Provider, Vehicle (with reg plate), Location. "Confirm Appointment" button calls `bookingService.rescheduleBooking(bookingId, { scheduledDate, scheduledTimeSlot })`.
- **Confirmed modal**: Full-screen overlay with blue gradient header, success check icon, "You're all booked!" title, booking reference card, next-steps list, "View My Bookings" CTA navigates to `/dashboard/bookings`.
- **`App.jsx`**: Added `<Route path="quotes/:id/book-appointment" element={<BookAppointment />} />` nested under the `/dashboard` protected layout.

### March 2026 (Maintenance & Robustness)

- **Service & Glass Multi-select**: Implemented multi-select for services and glass types in `BookingForm.jsx`. Introduced `serviceSelections` grouping logic to map glass types to specific services.
- **Support Numbers Migration**: Updated hardcoded support contact numbers to use dynamic settings from `useSettingsStore`.
- **Financial Fallbacks**: Implemented robust fallback logic for earnings and fees to handle legacy bookings.
- **Critical Fix**: Resolved a null pointer exception in `PaymentModal.jsx` where `payment.amount` was accessed before validation.
- **UI Consistency**: Standardized currency formatting and status-based overrides (e.g., zeroing earnings for refunded jobs).
- **Service UI Refinement**: Implemented `ServiceInfoCell` component to display multiple services and glass types as a clean list directly in table rows/cards (matching the Payments list style). This replaces the previous "View" button/modal for better direct visibility.

### 6 March 2026 (Quote-Only Flow — Payment Stays in Quotes, Bookings Shows Post-Payment Only)

- **Book Now / Booking Request menus hidden**: Platform is now quote-only. No new `searching` bookings created from the client portal.
- **`Bookings.jsx`**: Added filter to exclude `awaiting-payment` and `awaiting-provider-acceptance` from the bookings list — these statuses belong to the Quotes flow. Simplified `isActionRequired` to only flag `awaiting-customer-approval`, `searching`-with-quotes (legacy), and provider-proposed slot negotiation. Removed `awaiting-payment` from Upcoming tab status list.
- **`BookingDetailDrawer.jsx`**: Removed `awaiting-payment` and `awaiting-provider-acceptance` from `canCancel` — cancellation for those states is handled from the Quotes page.
- **`DashboardSidebar.jsx`**: "Request Quotes" badge now counts both `Responses` quotes AND `Accepted` quotes where the linked booking has `status === "awaiting-payment"`, prompting customer to pay.
- **`Quotes.jsx`**: Added amber **"Payment Due"** pill on quote list cards when `status === "Accepted"` and `booking.status === "awaiting-payment"` — visible without opening detail panel.
- **`QuoteDetailPanel.jsx`**: Replaced brittle `booking.status === "awaiting-payment"` exact-match with robust `bookingNeedsPayment` / `bookingIsConfirmed` flags. `bookingNeedsPayment` is true when: no booking yet, status is `awaiting-payment`, status is `awaiting-provider-acceptance` (legacy), or payment status is unpaid. This fixes the "View Booking" banner incorrectly showing instead of "Pay Now" for old-flow or missing-status bookings.

**Flow:**
```
Customer accepts quote → Quotes page shows "Payment Due" + Pay Now banner (sidebar badge fires)
Customer pays → booking: confirmed → NOW visible in Bookings page (Upcoming tab)
```

### 6 March 2026 (Remove Provider Acceptance Step from Quote Flow)

- **Quote Flow Simplified**: After accepting a quote, customers now pay immediately — no more "waiting for provider" step. `PaymentModal` opens automatically right after `acceptQuote` returns.
- **`useDashboardStore.js`**: `acceptQuote` action now returns the full `result.data` object (booking + quote) instead of just `bookingId`, so `PaymentModal` can be pre-populated.
- **`QuoteDetailPanel.jsx`**: Replaced "Awaiting Provider Confirmation" banner and slot negotiation UI with a "Payment Required" amber banner. `PaymentModal` added and opened immediately on accept. Removed `counterProposeSlot`, `acceptProposedSlot`, `rejectProposedSlot` from store destructuring. Removed `counterSlotModal` state and all slot negotiation handlers.
- **`BookingDetailDrawer.jsx`**: Added "Payment Required" amber banner for `booking.quote && status === "awaiting-payment"`. `canPay` updated to exclude these bookings from footer Pay button (banner handles it).
- **`dataMappers.js`**: Removed `awaiting-provider-acceptance` override that was keeping accepted quotes in the "Responses" tab. `awaiting-payment` quotes now correctly appear in "Accepted" tab.

### 6 March 2026 (Quote Booking Tab Fix)

- **Unconfirmed Quotes in Responses Tab**: Quotes with `awaiting-provider-acceptance` booking status now appear in "Responses" tab instead of "Accepted" tab. `mapQuoteData` overrides computed status when booking time isn't confirmed yet. Backend `getQuotes` now populates `booking` with `status` and `slotNegotiation` fields.

### 6 March 2026 (Bookings Badge & Quote Accept Fixes)

- **Bookings Badge Stale Count (C-014)**: A previous session incorrectly added `awaiting-provider-acceptance` (with `slotNegotiation.status === "provider-proposed"`) to the sidebar badge count. These bookings are intentionally excluded from the Bookings page — they belong to the quote flow and are tracked via the Quotes page (QuoteDetailPanel). Removed that condition from `DashboardSidebar.jsx`. Badge now only counts `awaiting-customer-approval` and `searching` (with quotes/suggestions), matching what is actually visible and actionable on the Bookings page.
- **Dual Toast on Quote Accept (C-015)**: Fixed two stacked bugs: (1) `handleAcceptQuote` in `QuoteDetailPanel.jsx` showed success toast even when `acceptQuote` returned null — now guarded by `if (bookingId)`. (2) `acceptQuote` in `useDashboardStore.js` wrapped `fetchQuotes`/`fetchBookings` in the same try/catch — if the refresh failed after a successful acceptance the catch block fired, showing an error toast and discarding the booking ID. Now the booking ID is captured before the refreshes, and refreshes run with `.catch(()=>{})` so their failures never mask a successful acceptance.

### 6 March 2026 (Vehicle Database System)

- **Database-backed Vehicle Makes/Models**: Replaced NHTSA API and static `vehicleMakes`/`commonSAModels` with backend API (`/api/public/vehicles`). `vehicleService.js` now calls the database instead of external APIs.
- **Creatable Vehicle Entries**: BookSearch, BookingForm, Profile, and RequestQuoteModal now support custom make/model creation via PremiumSelect `isCreatable` + `vehicleService.createMake()`/`createModel()`.
- **No More NHTSA**: Removed all references to `vpic.nhtsa.dot.gov` API. Vehicle data is fully self-hosted.

### 6 March 2026 (Slot Selection & Negotiation)

- **SelectSlotModal Component**: New `components/dashboard/SelectSlotModal.jsx` — date picker + provider availability API integration with slot grid selector. Used when accepting a quote to select a preferred time slot.
- **Quote Acceptance Flow**: Accepting a quote now opens `SelectSlotModal` instead of a simple confirm dialog. Customer must select a date and time slot from the provider's availability. Both `QuoteDetailPanel.jsx` and `QuoteDetail.jsx` updated.
- **Slot Negotiation UI**: `QuoteDetailPanel.jsx` shows a "Provider Suggested a Different Time" banner when provider proposes a different slot. Customer can Accept, Change Time (counter-propose), or Reject.
- **New Store Actions**: `acceptProposedSlot`, `rejectProposedSlot`, `counterProposeSlot` added to `useDashboardStore.js`
- **New API Methods**: `bookingService.js` — `acceptProposedSlot`, `rejectProposedSlot`, `counterProposeSlot`; `quoteService.js` — `getProviderAvailability`
- **Upcoming Bookings Fix**: `awaiting-provider-acceptance` status now included in the "upcoming" tab filter in `Bookings.jsx`
- **Quote 404 Loop Fix**: `fetchQuoteDetails` now tracks failed (404) quote IDs with a 5-minute cooldown to prevent repeated API spam. `Quotes.jsx` shows error toast and redirects to quote list when a deep-linked quote is inaccessible
- **SelectSlotModal Header**: Changed title to "Schedule Booking" with "Select a date & time" subtitle
- **Empty Slots Fix**: `QuoteDetailPanel.jsx` — `getQuotes` doesn't nest-populate `responses.provider`, so provider was a raw ObjectId string. Added `typeof` check to use string directly as provider ID
- **Duplicate Toast Fix**: Removed store-level success toast from `acceptQuote` action; component handles specific messaging
- **RequestQuoteModal Schedule Removal**: Removed "Preferred Schedule" section (PremiumDatePicker + time slot). Scheduling now happens only at quote acceptance time via SelectSlotModal
- **Slot Format Normalization**: Backend normalizes provider-stored slots (e.g., "08:00-10:00") to spaced format ("08:00 - 10:00")
- **Quote Acceptance Redirect Fix**: Customer now stays on quotes page after accepting a quote (instead of redirecting to bookings page where the booking is hidden due to `awaiting-provider-acceptance` filter). Shows success toast and refreshes quote details
- **Notification Routing Fix**: Quote-related notifications (`quote_accepted`, `slot_change_proposed`, `slot_proposed`, `quote_response`, `new_quote_response`) now route to `/dashboard/quotes/:quoteId` instead of `/dashboard/bookings/:bookingId`. Generic quote-type notifications with `quoteId` also route correctly. Direct booking notifications unchanged

### v1.0.0 — February 2026

- Complete customer portal with booking, quotes, payments flows
- Broadcast booking system (Uber-style provider search)
- Real-time socket integration for provider acceptance
- Paystack payment integration
- Profile management with vehicles & addresses
- In-app chat with providers
- Support ticket system
- Maintenance mode support

---

### 18 March 2026 (Staff-Aware Availability — Service-Type Capacity)

- **`quoteService.js` — `getProviderAvailability` accepts `serviceTypes` + `glassTypes`**: Third and fourth optional parameters (string arrays). Appended as `&serviceTypes=replacement,repair&glassTypes=windscreen,quarter-glass` query params. Backend uses these to filter eligible staff (by both service type AND glass type sub-services) and compute concurrent slot capacity.
- **`BookAppointment.jsx` — passes `serviceTypes` + `glassTypes` to availability API**: Derives `bookingServiceTypes` from `booking.serviceTypes`, `serviceSelections[].serviceType`, or `serviceType` (legacy). Derives `bookingGlassTypes` from `booking.glassTypes`, `serviceSelections` flatMap, or `glassType` (legacy). Both passed to `fetchSlotsForDate` and `prefetchMonth`.
- **Impact**: Business providers with 3 "replacement + windscreen" staff now show 10:00 as "available" even when 1 booking exists at that time (capacity=3). Staff who only handle "quarter-glass" won't count toward "windscreen" capacity. Individual providers unchanged. Staff with no subServices configured = handles all glass types (backward compat).

### 18 March 2026 (Reschedule Flow — Client Awareness)

- **`socketService.js` — `booking_rescheduled` listener added**: Client socket now refreshes bookings store when `booking_rescheduled` notification is received. Previously only the provider portal listened for this event — the client portal required a manual page reload to see updated dates after reschedule.
- **`BookingCard.jsx` — "Rescheduled" amber pill**: When `booking.rescheduledAt` is truthy, an amber pill with `RefreshCw` icon and "Rescheduled" text is shown in the card header (between status badge and reference number). Uses semi-transparent amber background matching the scheduled card's white-on-dark style.
- **`BookingDetailDrawer.jsx` — "Rescheduled" badge**: When `booking.rescheduledAt` is truthy, an amber badge with `RefreshCw` icon appears alongside the status/payment badges at the top of the drawer. Styled consistently with the existing service mode pill pattern (`backgroundColor: #fef3c7`, `color: #92400e`).
- **Backend dependency**: Requires `rescheduledAt` field on `Booking.js` model (added in same session). Field is set by `rescheduleBooking` controller only when `oldDate` exists (reschedule, not first-time scheduling).

### 18 March 2026 (Reschedule Page Crash Fix — Vehicle & Location)

- **`BookAppointment.jsx` — Reschedule vehicle field access fixed (C-030)**: Raw booking API returns `vehicle` as a subdocument (`b.vehicle.make`, `b.vehicle.model`, `b.vehicle.year`, `b.vehicle.registrationNumber`), but reschedule `loadBooking` used `dataMappers`-style flat names (`b.vehicleMake`, `b.vehicleModel`, etc.) which are `undefined` on raw data. `vehicleFormatted` became empty, fallback `quote.vehicle` was the raw object `{ registrationNumber }`, rendered as React child → crash. Fixed all field access to `b.vehicle?.make` etc.
- **`BookAppointment.jsx` — Reschedule location fixed**: `location: b.location` set on the quote-like object, but Booking model has no `location` field (it's `serviceAddress`). Changed to `location: b.serviceAddress || b.location`.
- **`BookAppointment.jsx` — `vehicleStr` safety guard**: Added `typeof quote?.vehicle === "string"` check so an object can never be rendered as a React child.

### 19 March 2026 (Service Mode Toggle Re-enabled)

- **Service mode selector restored** in `NewQuote.jsx` Step 3. The Mobile/Workshop toggle cards are now live JSX (no longer commented out).
- **Address fields conditional**: Street Address, Suburb, and Postcode fields are now conditionally rendered — hidden when `serviceMode === "workshop"`, shown for `"mobile"`.
- **Validation restored**: `validateStep` and `validate()` only require `addressLine1` when `formData.serviceMode !== "workshop"` (these lines were already updated on 18 March and were not changed).

### 18 March 2026 (Service Mode Toggle Hidden for Go-Live)

- **Service mode selector hidden** in `NewQuote.jsx` Step 3. The Mobile/Workshop toggle cards are commented out. Default `serviceMode: "mobile"` is still sent in the payload. All address fields (Street, Suburb, Postcode) are always shown.
- **Validation updated**: `validateStep` and `validate()` always require `addressLine1` (removed `serviceMode !== "workshop"` conditional).
- **Re-enabled 19 March 2026** — see entry above.

### 17 March 2026 (Address Modal Inline Validation)

#### Profile.jsx — Address Modal Inline Errors (C-016)
- **Inline validation**: Added `addressErrors` state. `handleSaveAddress` validates `street` and `city` before API call — sets inline errors and short-circuits if empty. Errors cleared when modal opens (`openAddressModal`) and on field change.
- **Error props**: Street Address `Input` and City `PremiumSelect` now receive `error={addressErrors.street}` / `error={addressErrors.city}` — both components already support the `error` prop for red border + error text display.

### 17 March 2026 (Post-Implementation Fix — Service Mode Label + Icons)

- **`NewQuote.jsx` — Step 3 label renamed**: Changed "Service Type" to "Service Mode" to avoid label clash with Step 2's "Service Type" (which means service category like Glass Replacement/Repair).
- **`NewQuote.jsx` — Emoji replaced with Lucide icons**: Mobile card `🚐` → `<Truck size={24} />`, Workshop card `🏭` → `<Building2 size={24} />`. Added `Truck, Building2` to lucide-react imports. Dark mode classes applied.

### 17 March 2026 (Phase 5 — Service Mode Toggle)

- **`NewQuote.jsx` — Service Mode selector added**: Step 3 (Location) now shows a two-card toggle ("Mobile" / "Workshop") before the address fields. Default is `"mobile"`. State held in `formData.serviceMode`.
- **Conditional address fields**: When `serviceMode === "workshop"`, the Street Address, Suburb, and Postcode fields are hidden — only City / Area is required. Street Address (`addressLine1`) is required only for mobile mode (validated in both `validateStep` and the final `validate()` function).
- **Submit payload updated**: `serviceLocation.type` now uses `formData.serviceMode || "mobile"` instead of the hardcoded `"mobile"` string.
- **Dark mode support**: Toggle cards follow the existing `dark:` Tailwind class pattern used throughout the portal.

### 17 March 2026 (Phase 8 — Customer-Facing Service Mode Display)

- **`QuoteDetailPanel.jsx` — Service Mode badge in context bar**: Added a service mode badge ("Mobile" / "Workshop") in the Location column of the dark gradient context bar. Conditionally rendered when `quote.serviceLocation.type` is set and not `"any"`. Blue tint for mobile, amber tint for workshop. Uses inline `style` for colors (consistent with existing context bar inline-style pattern on a dark background).
- **`BookingDetailDrawer.jsx` — Service mode indicator near status badges**: Added a service mode pill ("Mobile" / "Workshop") alongside the booking and payment StatusBadges at the top of the drawer. Conditionally rendered when `booking.serviceLocationType` is set and not `"any"`. Status badges wrapper changed from `flex` to `flex flex-wrap` to accommodate the extra pill without overflow.
- **`BookingDetailDrawer.jsx` — Workshop address section**: Added a new info row below the Location row in Service Details. Conditionally rendered when `booking.serviceLocationType === "workshop"` and `booking.provider.serviceArea.workshopAddress` is present. Shows `addressLine1`, optional `suburb`, `city + province`, and optional `postalCode`. Uses an amber `MapPin` icon to visually distinguish it from the customer's service address.

### 17 March 2026 (Phase 4 — Geolocation)

- **`NewQuote.jsx` — `geocodeAddress` helper added**: Module-level async function that calls `nominatim.openstreetmap.org/search` with `countrycodes=za` and `User-Agent: AutoScreen/1.0`. Returns `{ lat, lng }` or `null` on failure.
- **`NewQuote.jsx` — `handleUseMyLocation` handler added**: Uses `navigator.geolocation.getCurrentPosition`, stores GPS coordinates in `formData.coordinates`, then reverse-geocodes via Nominatim to auto-fill `city`, `suburb`, `addressLine1`, and `postcode` fields.
- **`NewQuote.jsx` — "Use My Location" button added in Step 3**: Appears right-aligned above the City/Area PremiumSelect. Styled with `text-primary-600`, `border-primary-300`, dark mode variants.
- **`NewQuote.jsx` — submit geocoding updated**: Replaced `geocodingService.getCoordinates` fallback with Nominatim `geocodeAddress` call. Condition tightened to `!finalCoordinates?.lat` to avoid unnecessary API calls when coordinates were set via "Use My Location".

---

_This is the master workflow reference for the AutoScreen Customer Portal._
_For extended booking flow details, see [`docs/BOOK_A_SERVICE_WORKFLOW.md`](./docs/BOOK_A_SERVICE_WORKFLOW.md)._
