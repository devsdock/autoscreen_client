---
name: Client Portal Development
description: Guidelines for the React/Vite customer-facing portal (autoscreen_client).
---

# AutoScreen Client Portal Skills

The client portal (`autoscreen_client`) is the **customer-facing dashboard** where customers manage their windscreen repair/replacement bookings, quotes, payments, and support requests.

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

- **Dev Server**: `http://localhost:5174` (Vite)
- **Auth Token Key**: `client-token` (localStorage)

## 1. Architecture

```
autoscreen_client/src/
├── App.jsx                  # Route definitions
├── components/
│   ├── dashboard/           # Dashboard-specific UI components (DashboardLayout, Sidebar, Header, etc.)
│   ├── layout/              # General layout components (Header.jsx, Layout.jsx, Sidebar.jsx)
│   ├── ui/                  # Shared UI primitives (Modal, Button, Badge, etc.)
│   └── skeletons/           # Loading skeleton components
├── pages/
│   └── dashboard/           # All customer dashboard pages
├── services/                # Axios API service files per domain
├── store/                   # Zustand state stores
└── utils/                   # Helpers (api.js, formatters, etc.)
```

## 2. Routing

All customer pages live under `/dashboard`. Routes are defined in `App.jsx`:

| Route                                        | Component             | Description                      |
| -------------------------------------------- | --------------------- | -------------------------------- |
| `/dashboard`                                 | `Overview`            | Main dashboard overview          |
| `/dashboard/book`                            | `BookSearch`          | Start a new booking (Uber-style) |
| `/dashboard/book/request`                    | `BookingForm`         | Fill in windscreen details       |
| `/dashboard/booking/searching/:bookingId`    | `BookingSearching`    | Searching for a provider         |
| `/dashboard/booking/pending/:bookingId`      | `BookingPending`      | Awaiting provider acceptance     |
| `/dashboard/booking/confirmation/:bookingId` | `BookingConfirmation` | Booking confirmed                |
| `/dashboard/quotes`                          | `Quotes`              | List of customer quotes          |
| `/dashboard/quotes/:id`                      | `Quotes`              | View a specific quote            |
| `/dashboard/bookings`                        | `Bookings`            | List of bookings                 |
| `/dashboard/bookings/:id`                    | `Bookings`            | View a specific booking          |
| `/dashboard/payments`                        | `Payments`            | Payment history                  |
| `/dashboard/profile`                         | `Profile`             | Customer profile & edit          |
| `/dashboard/support`                         | `Support`             | Help & support                   |
| `/dashboard/messages`                        | `Messages`            | In-app messaging                 |

## 3. State Management (Zustand Stores)

Stores are located in `src/store/`:

- **`useAuthStore`** – Customer auth, login/logout, token management.
- **`useDashboardStore`** – Booking data, quotes, payments (large store, ~34KB).
- **`useNotificationStore`** – In-app notification counts and payloads.
- **`useSettingsStore`** – App-wide settings (e.g., maintenance mode).
- **`useStore`** – UI state (sidebar open/close, general UI flags).

## 4. Auth & Route Protection

- All `/dashboard/*` routes are wrapped in `<ProtectedRoute>`.
- The `ProtectedRoute` component lives in `src/components/ProtectedRoute.jsx`.
- Token: stored as `client-token` in `localStorage`.

## 5. Booking Flow (Uber-Style)

The customer booking flow is:

1. `/dashboard/book` → Enter vehicle & location details.
2. `/dashboard/book/request` → Fill in windscreen damage details.
3. `/dashboard/booking/searching/:bookingId` → System searches for a provider.
4. `/dashboard/booking/pending/:bookingId` → Provider matched, awaiting confirmation.
5. `/dashboard/booking/confirmation/:bookingId` → Booking confirmed, payment triggered.

## 6. API Services

Services are in `src/services/` and use the shared Axios instance from `src/utils/api.js`.

- Use `import.meta.env.VITE_API_URL` for the base API URL.

## 7. UI Patterns

- **Framework**: TailwindCSS
- **Icons**: `lucide-react`
- **Modals/Overlays**: Use shared `Modal` from `src/components/ui/`
- **Loading States**: Use skeleton components from `src/components/skeletons/`
- **Toast Notifications**: Use the notification store.
