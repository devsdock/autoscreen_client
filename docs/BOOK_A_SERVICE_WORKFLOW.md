# Book a Service — Complete Workflow Documentation

> **Feature:** End-to-end booking flow for AutoScreen Customer Dashboard  
> **Version:** 1.0.0  
> **Last Updated:** December 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Journey Flow](#user-journey-flow)
3. [Routes & Pages](#routes--pages)
4. [Data Models](#data-models)
5. [Step-by-Step Workflow](#step-by-step-workflow)
6. [State Management](#state-management)
7. [UI Components](#ui-components)
8. [Business Logic](#business-logic)
9. [Error Handling](#error-handling)
10. [Testing Checklist](#testing-checklist)

---

## Overview

The "Book a Service" feature allows customers to search for auto glass service providers, view their profiles, and complete a booking through a multi-step form. The entire flow is implemented as a front-end prototype with localStorage persistence.

### Key Features
- 🔍 Search by vehicle, service type, and location
- 📋 Browse and filter provider listings
- ⭐ View detailed provider profiles with ratings and reviews
- 📝 Multi-step booking form with stepper navigation
- 💳 Payment simulation with multiple methods
- ✅ Booking confirmation with summary

---

## User Journey Flow

```
┌─────────────────┐
│   Dashboard     │
│   Overview      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Search & Book  │  ◄─── Entry point: Sidebar "Book a Service"
│  /dashboard/book│
└────────┬────────┘
         │ Submit search
         ▼
┌─────────────────┐
│  Provider List  │  ◄─── Grid/List view, filters, sorting
│/dashboard/providers
└────────┬────────┘
         │ Click "View Profile"
         ▼
┌─────────────────┐
│Provider Profile │  ◄─── Services, reviews, gallery, availability
│/dashboard/providers/:id
└────────┬────────┘
         │ Select service → "Continue"
         ▼
┌─────────────────┐
│  Booking Form   │  ◄─── 5-step stepper
│/dashboard/book/:providerId
└────────┬────────┘
         │ Submit booking
         ▼
┌─────────────────┐
│ Pending Status  │  ◄─── Waiting for provider
│/dashboard/booking/pending/:id
└────────┬────────┘
         │ Provider accepts
         ▼
┌─────────────────┐
│  Pay Now        │  ◄─── Payment modal
│  (same page)    │
└────────┬────────┘
         │ Payment confirmed
         ▼
┌─────────────────┐
│  Confirmation   │  ◄─── Success page
│/dashboard/booking/confirmation/:id
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  My Bookings    │  ◄─── Booking appears in list
│/dashboard/bookings
└─────────────────┘
```

---

## Routes & Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard/book` | `BookSearch.jsx` | Search form entry point |
| `/dashboard/providers` | `ProviderList.jsx` | Provider results list/grid |
| `/dashboard/providers/:id` | `ProviderProfile.jsx` | Individual provider details |
| `/dashboard/book/:providerId` | `BookingForm.jsx` | Multi-step booking form |
| `/dashboard/booking/pending/:bookingId` | `BookingPending.jsx` | Pending booking status |
| `/dashboard/booking/confirmation/:bookingId` | `BookingConfirmation.jsx` | Success confirmation |

---

## Data Models

### Provider
```javascript
{
  id: "PRV-001",
  name: "GlassFit Pro",
  type: "Business" | "Individual",
  rating: 4.8,
  reviewsCount: 156,
  verified: true,
  topRated: true,
  address: {
    line1: "45 Industrial Road",
    city: "Sandton",
    postcode: "2196"
  },
  serviceAreas: ["Sandton", "Rosebank", "Randburg"],
  about: "Description text...",
  phone: "+27 11 234 5678",
  email: "info@provider.co.za",
  services: [
    {
      id: "SVC-001",
      name: "Windscreen Replacement",
      description: "Full windscreen replacement",
      fromPrice: 1850,
      durationMins: 90
    }
  ],
  galleryImages: ["url1", "url2"],
  availability: [
    {
      date: "2025-12-20",
      slots: ["08:00-09:00", "09:00-10:00", "14:00-15:00"]
    }
  ],
  mobileService: true,
  insuranceClaims: true
}
```

### Booking
```javascript
{
  id: "BK-XXXXXXXX",
  reference: "B-2025-00007",
  customerId: "USR-001",
  providerId: "PRV-010",
  providerName: "Mike's Mobile Glass",
  providerType: "Individual",
  providerRating: 4.6,
  providerReviews: 53,
  vehicle: {
    make: "Toyota",
    model: "Corolla",
    year: "2025"
  },
  service: {
    id: "SVC-001",
    name: "Windscreen Replacement",
    fromPrice: 1750,
    durationMins: 100
  },
  glassType: "Windscreen",
  scheduledDate: "2025-12-20",
  timeSlot: "08:00-09:30",
  address: {
    id: "ADDR-001",
    label: "Home",
    line1: "123 Main Street",
    city: "Sandton",
    postcode: "2196"
  },
  remarks: "There's a crack on the driver's side...",
  uploadedImages: [],
  bookingStatus: "Pending" | "Accepted" | "Confirmed" | "Completed" | "Cancelled",
  paymentStatus: "Unpaid" | "Pending" | "Paid" | "Refunded",
  price: {
    subtotal: 1750,
    platformFee: 88,
    total: 1838
  },
  createdAt: "2025-12-19T16:52:00.000Z",
  acceptedAt: "2025-12-19T16:52:30.000Z",
  paidAt: "2025-12-19T16:53:00.000Z",
  paymentMethod: "card",
  timeline: [
    { status: "Booking Requested", date: "...", completed: true },
    { status: "Provider Accepted", date: "...", completed: true },
    { status: "Payment Received", date: "...", completed: true },
    { status: "Appointment Scheduled", date: "...", completed: true },
    { status: "Job Completed", date: null, completed: false }
  ]
}
```

### Review
```javascript
{
  id: "REV-001",
  providerId: "PRV-001",
  authorName: "John Smith",
  rating: 5,
  comment: "Excellent service!",
  createdAt: "2025-11-15T10:30:00.000Z"
}
```

### Customer Address
```javascript
{
  id: "ADDR-001",
  label: "Home" | "Work" | "Other",
  line1: "123 Main Street",
  city: "Sandton",
  postcode: "2196"
}
```

---

## Step-by-Step Workflow

### Step 1: Search (`/dashboard/book`)

**User Actions:**
1. Select vehicle make from dropdown
2. Enter vehicle model
3. Select vehicle year
4. Select glass type (Windscreen, Side Window, etc.)
5. Select service type (Repair, Replacement)
6. Select city
7. (Optional) Enter postcode
8. Click "Find Providers"

**System Actions:**
- Store search criteria in component state
- Navigate to `/dashboard/providers` with query params

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Make | Select | ✅ |
| Model | Text Input | ✅ |
| Year | Select | ❌ |
| Glass Type | Select | ✅ |
| Service Type | Select | ✅ |
| City | Select | ✅ |
| Postcode | Text Input | ❌ |

---

### Step 2: Provider List (`/dashboard/providers`)

**Display Features:**
- Grid/List view toggle
- Filter by: Provider type, Rating, Price range
- Sort by: Highest rated, Lowest price, Most reviews
- Search criteria summary bar
- "Edit Search" button

**Provider Card Shows:**
- Provider avatar/initial
- Name + type badge (Individual/Business)
- Verified badge (if applicable)
- Rating stars + review count
- Location
- Top 2-3 services
- Starting price ("From R X,XXX")
- "View Profile" CTA

**Filter Logic:**
```javascript
// Filter by city/service area match
providers.filter(p => 
  p.serviceAreas.some(area => 
    area.toLowerCase().includes(searchCity.toLowerCase())
  )
)
```

---

### Step 3: Provider Profile (`/dashboard/providers/:id`)

**Sections:**
1. **Header** - Name, badges, rating, contact info
2. **Next Available** - Quick booking slot preview
3. **Tab Navigation:**
   - Services - List with prices, durations, "Select" action
   - Reviews - Customer ratings and comments
   - About - Provider description
   - Gallery - Image grid

**Service Selection:**
1. User clicks a service card
2. Card shows "Selected" badge with checkmark
3. "Continue with [Service Name]" button appears
4. Click navigates to booking form

---

### Step 4: Booking Form (`/dashboard/book/:providerId`)

**Stepper Navigation:**
```
[1. Service] → [2. Date & Time] → [3. Address] → [4. Details] → [5. Review]
```

#### Step 4.1: Service & Vehicle
- Confirm/change selected service
- Vehicle make, model, year (prefilled from search)
- Glass type (prefilled)

#### Step 4.2: Date & Time
- Date picker showing available dates
- Time slot buttons for selected date
- Slots from provider's `availability` data
- Only future dates shown

**Slot Filtering:**
```javascript
availability.filter(a => 
  new Date(a.date) >= new Date().setHours(0,0,0,0)
)
```

#### Step 4.3: Address
- Radio card selection for saved addresses
- "Add New" button opens modal
- New address fields: Label, Line 1, City, Postcode

#### Step 4.4: Remarks & Images
- Textarea for special instructions
- Drag-and-drop image upload
- Image preview thumbnails
- Remove image button

#### Step 4.5: Review & Submit
- Full summary of booking details:
  - Provider info
  - Service & vehicle
  - Date & time
  - Address
  - Remarks
  - Uploaded images (thumbnails)
- Price breakdown:
  - Service: R X,XXX
  - Platform fee (5%): R XXX
  - **Total: R X,XXX**
- "Send Booking Request" CTA

---

### Step 5: Pending Status (`/dashboard/booking/pending/:bookingId`)

**Initial State (Pending):**
- "Waiting for Provider" header
- Booking reference displayed
- Progress timeline (Request Sent ✓)
- Booking details summary
- Animated waiting indicator
- **Demo Mode:** "Simulate Provider Acceptance" button

**After Acceptance:**
- Header changes to "Provider Accepted!"
- Timeline updates (Provider Accepted ✓)
- "Pay Now — R X,XXX" button appears
- Payment required banner

---

### Step 6: Payment Modal

**Triggered by:** "Pay Now" button click

**Modal Contents:**
1. Price breakdown (Service + Platform fee = Total)
2. Payment method selection:
   - Credit/Debit Card (default)
   - EFT Bank Transfer
   - Cash on Service
3. Card form fields (for card payment):
   - Card Number
   - Expiry (MM/YY)
   - CVV
4. "Pay R X,XXX" button

**Payment Flow:**
1. User selects method
2. (For card) Fills mock card details
3. Clicks "Pay R X,XXX"
4. Button shows "Processing..." (1.5s delay)
5. On success:
   - `paymentStatus = "Paid"`
   - `bookingStatus = "Confirmed"`
   - Create payment record
   - Redirect to confirmation

---

### Step 7: Confirmation (`/dashboard/booking/confirmation/:bookingId`)

**Success State:**
- Green checkmark icon
- "Booking Confirmed!" heading
- Booking reference

**What's Next Section:**
1. Confirmation Email - Details sent to email
2. Provider Contact - May call to confirm
3. Service Day - Provider arrives at location

**Booking Summary:**
- Provider card with call button
- Service & vehicle details
- Date, time, address
- Payment status badge (Paid ✓)
- Total paid amount

**Actions:**
- Download Receipt (stub)
- View All Bookings → `/dashboard/bookings`
- Back to Dashboard → `/dashboard`

---

## State Management

### Zustand Store Actions

```javascript
// Create new booking
createBooking: (bookingData) => {
  // Generate ID and reference
  // Build booking object
  // Add to bookings array
  // Create activity log
  // Show success toast
  // Return booking ID
}

// Simulate provider acceptance
simulateProviderAcceptance: (bookingId) => {
  // Update bookingStatus to "Accepted"
  // Set acceptedAt timestamp
  // Update timeline
  // Show toast
}

// Process payment
processBookingPayment: (bookingId, method) => {
  // Update paymentStatus to "Paid"
  // Update bookingStatus to "Confirmed"
  // Set paidAt timestamp
  // Create payment record
  // Update timeline
  // Show toast
}

// Add customer address
addAddress: (addressData) => {
  // Generate ID
  // Add to addresses array
}
```

### State Flow Diagram

```
[Search State] → [Provider Selection] → [Booking Form State]
                                              │
                    ┌─────────────────────────┤
                    │                         │
              [Step 1-4 Local State]    [Step 5 Submit]
                                              │
                                              ▼
                                    [Zustand: createBooking]
                                              │
                                              ▼
                                    [BookingPending Page]
                                              │
                               [simulateProviderAcceptance]
                                              │
                                              ▼
                                    [processBookingPayment]
                                              │
                                              ▼
                                    [BookingConfirmation Page]
```

---

## UI Components

### Core Components Used

| Component | Purpose |
|-----------|---------|
| `Button` | Primary/Secondary CTAs |
| `Card` | Content containers |
| `Modal` | Payment dialog, Add address |
| `Input` | Text fields |
| `Select` | Dropdowns |
| `Textarea` | Remarks input |
| `StatusBadge` | Booking/Payment status pills |
| `Rating` | Star display |
| `Avatar` | Provider initials |
| `Toast` | Success/error notifications |
| `EmptyState` | No results fallback |

### Custom Components

| Component | File | Purpose |
|-----------|------|---------|
| `BookSearch` | `pages/dashboard/BookSearch.jsx` | Search form |
| `ProviderList` | `pages/dashboard/ProviderList.jsx` | Results grid/list |
| `ProviderProfile` | `pages/dashboard/ProviderProfile.jsx` | Provider details |
| `BookingForm` | `pages/dashboard/BookingForm.jsx` | Multi-step form |
| `BookingPending` | `pages/dashboard/BookingPending.jsx` | Pending status |
| `BookingConfirmation` | `pages/dashboard/BookingConfirmation.jsx` | Success page |

---

## Business Logic

### Price Calculation

```javascript
const calculatePrice = (servicePrice) => {
  const subtotal = servicePrice;
  const platformFeePercent = 0.05; // 5%
  const platformFee = Math.round(subtotal * platformFeePercent);
  const total = subtotal + platformFee;
  
  return { subtotal, platformFee, total };
};
```

### Booking Reference Format

```javascript
const generateReference = (count) => {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(5, '0');
  return `B-${year}-${paddedCount}`;
};
// Example: B-2025-00007
```

### Status Transitions

```
BOOKING STATUS:
Pending → Accepted → Confirmed → Completed
                  ↘ Cancelled

PAYMENT STATUS:
Unpaid → Pending → Paid
              ↘ Refunded
```

---

## Error Handling

### Form Validation

| Step | Validation |
|------|------------|
| Search | Make, Model, Glass Type, Service Type, City required |
| Step 1 | Service must be selected, Vehicle fields required |
| Step 2 | Date and time slot must be selected |
| Step 3 | Address must be selected or new address valid |
| Step 4 | Optional - no validation |
| Step 5 | Review only - no validation |

### Error States

- **No providers found:** Empty state with "Try different search" CTA
- **Provider not found:** Redirect to provider list
- **Booking not found:** Redirect to My Bookings
- **No availability:** "No slots available" message

---

## Testing Checklist

### Happy Path

- [ ] Complete search form with all required fields
- [ ] Navigate to provider list with correct filter
- [ ] View provider profile
- [ ] Select a service
- [ ] Complete all 5 booking steps
- [ ] Submit booking request
- [ ] Simulate provider acceptance
- [ ] Complete payment
- [ ] View confirmation page
- [ ] Verify booking in My Bookings list

### Edge Cases

- [ ] Search with minimal fields (only required)
- [ ] Filter providers by type
- [ ] Sort providers by different criteria
- [ ] Go back through booking steps
- [ ] Add new address during booking
- [ ] Cancel payment modal
- [ ] View pending booking before acceptance
- [ ] Navigate away and return to pending booking

### Responsive Testing

- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Sidebar collapse on mobile

### Dark Mode

- [ ] All pages render correctly in dark mode
- [ ] Proper contrast on all elements
- [ ] Status badges visible

---

## File Structure

```
src/
├── pages/
│   └── dashboard/
│       ├── BookSearch.jsx          # Search entry
│       ├── ProviderList.jsx        # Results
│       ├── ProviderProfile.jsx     # Provider details
│       ├── BookingForm.jsx         # Multi-step form
│       ├── BookingPending.jsx      # Pending status
│       ├── BookingConfirmation.jsx # Success page
│       └── Bookings.jsx            # My Bookings list
├── data/
│   ├── providers.js                # Provider mock data
│   ├── reviews.js                  # Review mock data
│   └── addresses.js                # Customer addresses
├── store/
│   └── useDashboardStore.js        # Zustand store
└── App.jsx                         # Route definitions
```

---

## Changelog

### v1.0.0 (December 2025)
- Initial implementation of complete booking flow
- Search, provider list, provider profile pages
- 5-step booking form with stepper
- Pending status with acceptance simulation
- Payment modal with method selection
- Confirmation page with summary
- Integration with My Bookings page

---

*This documentation is part of the AutoScreen Customer Dashboard project.*


