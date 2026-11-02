/**
 * Where a fitter works, from their profile: "mobile", "workshop", "both" or
 * null. Shown as a badge on each quotation (client feedback, 31 Oct 2026).
 *
 * Copy of autoscreen_node/utils/providerServiceMode.js (the backend uses it
 * for the Broker Desk); change both together. A workshop needs a company /
 * franchise, the workshop switch on and a workshop city, as in matching.
 */
export function providerServiceMode(provider) {
  const area = provider?.serviceArea || {};
  const mobile = area.offersMobileService !== false;
  const workshop =
    area.offersWorkshopService === true &&
    ["company", "franchise"].includes(provider?.businessType) &&
    Boolean(String(area.workshopAddress?.city || "").trim());
  if (mobile && workshop) return "both";
  if (workshop) return "workshop";
  if (mobile) return "mobile";
  return null;
}

export const SERVICE_MODE_LABEL = {
  mobile: "Mobile",
  workshop: "Workshop",
  both: "Mobile & Workshop",
};

/**
 * True when the fitter offers ADAS Recalibration (an active `adas` service).
 * Drives the "ADAS Recalibration" badge (client answer Q6, 2 Nov 2026). The
 * customer quote endpoints send `servicesOffered` with service type and isActive only.
 * Copy of providerOffersAdas in autoscreen_node/utils/providerServiceMode.js.
 */
export const providerOffersAdas = (provider) =>
  (provider?.servicesOffered || []).some((s) => s?.serviceType === "adas" && s?.isActive !== false);
