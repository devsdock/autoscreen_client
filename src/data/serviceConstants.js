/**
 * Centralized Service Constants for AutoScreen
 * These values MUST match across all frontends (web, client, provider) and backend
 */

// Service Types - What the provider does (matches backend schema enum)
export const SERVICE_TYPES = [
  {
    id: "replacement",
    label: "Replacement",
    description: "Full glass replacement",
  },
  { id: "repair", label: "Repair", description: "Chip & crack repair" },
  {
    id: "tinting",
    label: "Smash & Grab",
    description: "Smash & Grab film application",
  },
];

// Glass Types - Which glass is affected (matches backend schema enum)
export const GLASS_TYPES = [
  { id: "windscreen", label: "Windscreen" },
  { id: "front-side-left", label: "Side Window (Front Left)" },
  { id: "front-side-right", label: "Side Window (Front Right)" },
  { id: "rear-side-left", label: "Side Window (Rear Left)" },
  { id: "rear-side-right", label: "Side Window (Rear Right)" },
  { id: "rear-window", label: "Rear Window" },
  { id: "quarter-glass", label: "Quarter Glass" },
  { id: "sunroof", label: "Sunroof" },
];

// Location Types - Where service is performed
export const LOCATION_TYPES = [
  { id: "mobile", label: "Mobile Service", description: "We come to you" },
  { id: "workshop", label: "Workshop", description: "Bring to our location" },
];

// Helper arrays for simple dropdowns
export const SERVICE_TYPE_OPTIONS = SERVICE_TYPES.map((s) => ({
  value: s.id,
  label: s.label,
}));
export const GLASS_TYPE_OPTIONS = GLASS_TYPES.map((g) => ({
  value: g.id,
  label: g.label,
}));

// For simple string arrays (used in some select components)
export const SERVICE_TYPE_IDS = SERVICE_TYPES.map((s) => s.id);
export const SERVICE_TYPE_LABELS = SERVICE_TYPES.map((s) => s.label);
export const GLASS_TYPE_IDS = GLASS_TYPES.map((g) => g.id);
export const GLASS_TYPE_LABELS = GLASS_TYPES.map((g) => g.label);

// Backward compatibility exports (for existing components using string arrays)
export const serviceTypes = SERVICE_TYPE_LABELS;
export const glassTypes = GLASS_TYPE_LABELS;

export default {
  SERVICE_TYPES,
  GLASS_TYPES,
  LOCATION_TYPES,
  SERVICE_TYPE_OPTIONS,
  GLASS_TYPE_OPTIONS,
  serviceTypes,
  glassTypes,
};
