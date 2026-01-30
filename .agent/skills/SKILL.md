---
name: Client Portal Development
description: Comprehensive guide for developing the Customer/Client Portal.
---

# AutoScreen Client Portal Skill

This skill guides development for the Customer Portal (`autoscreen_client`), where users book services.

## 1. Project Structure

- **Framework**: React (Vite)
- **Styling**: TailwindCSS
- **State**: Zustand
- **Maps**: Google Maps API (if applicable for address)

## 2. Core Workflows

### Workflow: Booking Flow

The booking flow is the critical path.

1.  **Quote**: User enters vehicle details -> Gets Quote.
2.  **Select**: User selects service type (Windscreen, etc.).
3.  **Schedule**: User picks date/time.
4.  **Confirm**: User pays (Stripe) or confirms.

**Key Components**:

- `BookingWizard`: Orchestrates the steps.
- `VehicleSelector`: Handles Make/Model/Year input.

### Workflow: Create New Page

1.  **Create Page**: `src/pages/[Name].jsx`
2.  **Route**: Add to `src/routes.jsx` or `App.jsx`.
3.  **Layout**: Wrap in `MainLayout` (Navbar + Footer).

## 3. UI/UX Rules

- **Mobile First**: All designs must be fully responsive.
- **Forms**: Use floating labels or clear input borders. Validation messages must be immediate.
- **Loading**: Use Skeletons or Spinners for async actions.

## 4. API Integration

- **Auth**: `useAuthStore` stores JWT.
- **Axios**: Use configured instance which attaches Bearer token automatically.
