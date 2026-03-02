# AutoScreen Customer Portal — Complete Workflow Guide (`clude.md`)

> **Project:** AutoScreen Customer Dashboard  
> **Stack:** React + Vite, Zustand, React Router v6, Axios, Socket.IO  
> **Version:** 1.0.0  
> **Last Updated:** 02 March 2026

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
| Styling           | CSS Variables + Custom CSS           |

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

### Overview

Customers can request a standalone quote (without immediate booking) for a service.

### Flow

```
[Dashboard: "Quotes" section]
         │
         ▼
[Quotes.jsx] /dashboard/quotes
  - List of all quotes (Pending / Accepted / Expired)
  - **Note:** Supports `routeId` query param for deep linking into specific quotes.
         │ "Request New Quote" / New quote form
         ▼
[/dashboard/quotes/new]
  - Fill service & vehicle details
  - Submit quote request
         │
         ▼
[/dashboard/quotes/:id]
  - View single quote detail
  - Provider quote response
  - Accept / Decline quote
  - If accepted → trigger booking flow
```

### Quote States

| Status     | Description                  |
| ---------- | ---------------------------- |
| `Pending`  | Awaiting provider response   |
| `Quoted`   | Provider has sent a price    |
| `Accepted` | Customer accepted the quote  |
| `Declined` | Customer declined the quote  |
| `Expired`  | Quote validity period passed |

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
  /                         → Overview.jsx
  /book                     → BookSearch.jsx
  /book/request             → BookingForm.jsx
  /booking/searching/:id    → BookingSearching.jsx
  /booking/pending/:id      → BookingPending.jsx
  /booking/confirmation/:id → BookingConfirmation.jsx
  /quotes                   → Quotes.jsx
  /quotes/new               → Quotes.jsx (new quote mode)
  /quotes/:id               → Quotes.jsx (detail mode)
  /bookings                 → Bookings.jsx
  /bookings/:id             → Bookings.jsx (detail mode)
  /bookings/:id/:action     → Bookings.jsx (action mode)
  /payments                 → Payments.jsx
  /payments/:id             → Payments.jsx (detail)
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
│   ├── components/                # Reusable UI components (44 files)
│   │   ├── dashboard/
│   │   │   └── DashboardLayout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── ... (Button, Modal, Input, Toast, etc.)
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx          # (legacy/base)
│   │   ├── MaintenancePage.jsx
│   │   ├── Settings.jsx
│   │   ├── Users.jsx
│   │   ├── auth/
│   │   │   └── ImpersonatePage.jsx
│   │   └── dashboard/
│   │       ├── Overview.jsx         # Dashboard home
│   │       ├── BookSearch.jsx       # Service search form
│   │       ├── BookingForm.jsx      # 5-step booking form
│   │       ├── BookingSearching.jsx # Live provider search
│   │       ├── BookingPending.jsx   # Quote/payment pending
│   │       ├── BookingConfirmation.jsx # Booking confirmed
│   │       ├── Bookings.jsx         # My bookings list & detail
│   │       ├── Quotes.jsx           # Quotes list & form
│   │       ├── Payments.jsx         # Payment history
│   │       ├── Profile.jsx          # Profile + vehicles + addresses
│   │       ├── Messages.jsx         # Chat with provider
│   │       ├── Support.jsx          # Support tickets
│   │       ├── ProviderList.jsx     # Provider results (legacy)
│   │       ├── ProviderProfile.jsx  # Provider detail (legacy)
│   │       └── QuoteDetail.jsx      # Quote detail view
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

### March 2026 (Maintenance & Robustness)

- **Service & Glass Multi-select**: Implemented multi-select for services and glass types in `BookingForm.jsx`. Introduced `serviceSelections` grouping logic to map glass types to specific services.
- **Support Numbers Migration**: Updated hardcoded support contact numbers to use dynamic settings from `useSettingsStore`.
- **Financial Fallbacks**: Implemented robust fallback logic for earnings and fees to handle legacy bookings.
- **Critical Fix**: Resolved a null pointer exception in `PaymentModal.jsx` where `payment.amount` was accessed before validation.
- **UI Consistency**: Standardized currency formatting and status-based overrides (e.g., zeroing earnings for refunded jobs).

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

_This is the master workflow reference for the AutoScreen Customer Portal._
_For extended booking flow details, see [`docs/BOOK_A_SERVICE_WORKFLOW.md`](./docs/BOOK_A_SERVICE_WORKFLOW.md)._
