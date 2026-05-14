import { useState } from "react";
import {
  Star,
  BadgeCheck,
  Clock,
  MapPin,
  Shield,
  ShieldCheck,
  Check,
  Wrench,
  Phone,
  AlertTriangle,
  Wallet,
  Info,
} from "lucide-react";
import { formatCurrency } from "../../store/useDashboardStore";
import { formatDuration } from "../../utils/formatDuration";
import { NodeURL } from "../../services/api";

const ProviderResponseCard = ({
  response,
  onAccept,            // tier mode: invoked as onAccept(selectedQuality); legacy: invoked as onAccept()
  onMessage,
  onOpenGlassTypesModal, // NEW — called when info icon is clicked
  isAccepted = false,
  isRejected = false,
  disabled = false,
  bookingConfirmed = false,
  quoteData = null,
}) => {
  const {
    provider,
    responseType,
    price,
    etaText,
    message,
    status,
    estimatedDuration,
    serviceType,
    glassDetails,
    validUntil,
  } = response;

  // Tier-mode activation gate (mirrors backend resolveSelectedTier rules)
  const isTierMode =
    response?.tierPricing?.isActive === true &&
    Array.isArray(response?.tierPricing?.tiers) &&
    response.tierPricing.tiers.length >= 1;

  // Order tiers consistently: OEM > OEE > aftermarket
  const TIER_ORDER = ["OEM", "OEE", "aftermarket"];
  const orderedTiers = isTierMode
    ? TIER_ORDER
        .map((q) => response.tierPricing.tiers.find((t) => t.quality === q))
        .filter(Boolean)
    : [];

  // Selected tier state (local — committed only on Accept & Pay)
  const [selectedQuality, setSelectedQuality] = useState(null);

  // First-view pulse on info icon (one-shot per browser)
  const [hasSeenInfo, setHasSeenInfo] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("autoscreen-glass-types-explained-seen") === "1";
  });

  // Quality short-label + full-form tooltip text
  const QUALITY_LABELS = {
    OEM: { short: "OEM", full: "Original Equipment Manufacturer — factory-quality glass made by the original supplier." },
    OEE: { short: "OEE", full: "Original Equipment Equivalent — same quality made by a different certified manufacturer." },
    aftermarket: { short: "Generic", full: "Aftermarket / Generic — budget-friendly third-party glass." },
  };

  // Handle deleted/missing provider — show disabled card
  const isProviderDeleted = !provider || provider.isDeleted;

  const initials = isProviderDeleted
    ? "NA"
    : (provider.businessName || provider.name || "P")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  // Resolve provider avatar URL
  const providerAvatarUrl = (() => {
    if (isProviderDeleted) return null;
    const raw = provider.avatarUrl || provider.personalImageUrl || provider.companyLogoUrl || provider.profileImage;
    if (!raw) return null;
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    return `${NodeURL}${raw}`;
  })();

  // Time remaining — use the earlier of quote expiry and response validUntil
  const effectiveExpiry = (() => {
    const quoteExp = quoteData?.expiresAt ? new Date(quoteData.expiresAt) : null;
    const respExp = validUntil ? new Date(validUntil) : null;
    if (quoteExp && respExp) return quoteExp < respExp ? quoteExp : respExp;
    return quoteExp || respExp || null;
  })();

  const getTimeRemaining = () => {
    if (!effectiveExpiry) return null;
    const diff = effectiveExpiry - new Date();
    if (diff <= 0) return "Expired";
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ${hours}h ${mins}m left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };
  const timeLeft = getTimeRemaining();
  const isUrgent =
    effectiveExpiry && effectiveExpiry - new Date() < 6 * 60 * 60 * 1000;

  const displayName = isProviderDeleted
    ? "Provider"
    : ["company", "franchise", "Business"].includes(
        provider.businessType || provider.type
      )
      ? provider.businessName || provider.name
      : provider.name || "Provider";

  const isBest = response._bestValue;
  const quoteServiceMode = quoteData?.serviceLocation?.type;
  const isWorkshopService = quoteServiceMode === "workshop" || serviceType === "workshop";
  const locType = isWorkshopService ? "Workshop" : "Mobile";
  const locShort = isWorkshopService ? "WS" : "MOB";

  // Service lines from glass details or customer quote
  const svcLines = [];
  if (glassDetails?.brand) {
    const quality = glassDetails.quality === "OEM" ? "OEM" : glassDetails.quality === "OEE" ? "OEE" : "Aftermarket";
    svcLines.push(`${quality} ${glassDetails.brand}`);
  } else if (quoteData?.serviceSelections?.length > 0) {
    quoteData.serviceSelections.forEach((s) => {
      if (s.glassTypes?.length > 0) {
        s.glassTypes.forEach((g) => svcLines.push(`${s.serviceName} — ${g}`));
      } else {
        svcLines.push(s.serviceName);
      }
    });
  } else if (quoteData?.serviceTypes?.length > 0 && quoteData?.glassTypes?.length > 0) {
    quoteData.glassTypes.forEach((g, i) => {
      svcLines.push(`${quoteData.serviceTypes[i] || quoteData.serviceTypes[0]} — ${g}`);
    });
  } else if (quoteData?.serviceType) {
    svcLines.push(quoteData.serviceType);
  }
  if (svcLines.length === 0) svcLines.push("Quote Response");

  const InfoIconButton = ({ className = "" }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!hasSeenInfo && typeof window !== "undefined") {
          localStorage.setItem("autoscreen-glass-types-explained-seen", "1");
          setHasSeenInfo(true);
        }
        onOpenGlassTypesModal?.();
      }}
      className={`relative inline-flex items-center justify-center w-5 h-5 rounded-full text-sky-500 hover:text-sky-600 transition-colors ${className}`}
      aria-label="Learn about glass types"
    >
      {!hasSeenInfo && (
        <span
          className="absolute inset-0 rounded-full bg-sky-400/40 animate-ping"
          aria-hidden="true"
        />
      )}
      <Info size={16} className="relative" />
    </button>
  );

  return (
    <div
      style={{
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: isAccepted
          ? "0 4px 6px -1px rgba(34,197,94,.12), 0 0 0 1px rgba(34,197,94,.12)"
          : "0 4px 6px -1px rgba(15,23,42,.08), 0 2px 4px -2px rgba(15,23,42,.05)",
        transition: "all 200ms cubic-bezier(.4,0,.2,1)",
        cursor: isRejected ? "default" : "pointer",
        position: "relative",
        opacity: isRejected ? 0.55 : 1,
      }}
      className={`bg-white dark:bg-slate-800 border-[1.5px] ${isAccepted ? "border-green-500" : "border-slate-200 dark:border-slate-700"} hover:shadow-xl hover:-translate-y-0.5`}
    >
      {/* Best Value Ribbon */}
      {isBest && !isAccepted && !isRejected && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "1.25rem",
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            color: "#fff",
            fontSize: ".625rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            padding: ".25rem .75rem",
            borderRadius: "0 0 .5rem .5rem",
            boxShadow: "0 4px 14px rgba(37,99,235,.25)",
            display: "flex",
            alignItems: "center",
            gap: ".25rem",
            zIndex: 2,
          }}
        >
          <Star size={9} className="fill-current" />
          Best Value
        </div>
      )}

      {/* Accepted Ribbon */}
      {isAccepted && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "1.25rem",
            background: "linear-gradient(135deg, #16A34A, #15803D)",
            color: "#fff",
            fontSize: ".625rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            padding: ".25rem .75rem",
            borderRadius: "0 0 .5rem .5rem",
            boxShadow: "0 4px 14px rgba(22,163,74,.25)",
            display: "flex",
            alignItems: "center",
            gap: ".25rem",
            zIndex: 2,
          }}
        >
          <BadgeCheck size={9} />
          Accepted
        </div>
      )}

      {/* ── Ticket Main ── */}
      <div
        className="flex flex-col sm:flex-row items-stretch border-b border-dashed border-slate-200 dark:border-slate-700"
      >
        {/* Provider Column — bg extends full height, padding-top added when badge present */}
        <div
          style={{
            flexShrink: 0,
            gap: ".5rem",
            paddingTop: isBest || isAccepted ? "1.625rem" : undefined,
          }}
          className="bg-slate-50 dark:bg-slate-800/50 flex flex-row sm:flex-col items-center sm:items-start sm:justify-center sm:w-[160px] border-b sm:border-b-0 sm:border-r border-dashed border-slate-200 dark:border-slate-700 p-3 sm:p-5"
        >
          {providerAvatarUrl ? (
            <img
              src={providerAvatarUrl}
              alt={displayName}
              style={{
                width: 44,
                height: 44,
                borderRadius: "1rem",
                objectFit: "cover",
                boxShadow: "0 4px 6px -1px rgba(15,23,42,.08), 0 2px 4px -2px rgba(15,23,42,.05)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: ".9375rem",
                boxShadow:
                  "0 4px 6px -1px rgba(15,23,42,.08), 0 2px 4px -2px rgba(15,23,42,.05)",
                background: isAccepted
                  ? "linear-gradient(135deg, #16A34A, #15803D)"
                  : "linear-gradient(135deg, #2563EB, #1E40AF)",
              }}
            >
              {initials}
            </div>
          )}
          <div
            style={{
              fontSize: ".9375rem",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
            className="text-slate-900 dark:text-white"
          >
            {displayName}
          </div>
          {!isProviderDeleted && (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                {provider.businessType && (
                  <span style={{ fontSize: ".75rem" }} className="text-slate-500 dark:text-slate-400">
                    {provider.businessType === "company" ||
                    provider.businessType === "franchise"
                      ? "Franchise Workshop"
                      : "Independent Fitter"}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".25rem",
                  fontSize: ".75rem",
                  fontWeight: 600,
                }}
                className="text-slate-700 dark:text-slate-300"
              >
                <Star
                  size={11}
                  style={{ fill: "#F59E0B", color: "#F59E0B" }}
                />
                {(provider.rating || 0).toFixed(1)}
                {provider.reviewCount > 0 && (
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: ".6875rem",
                    }}
                    className="text-slate-400 dark:text-slate-500"
                  >
                    ({provider.reviewCount})
                  </span>
                )}
              </div>
              {((provider.businessType !== "individual" && provider.vatNumber) ||
                response.isInsuranceRegistered ||
                provider.paymentOptions?.cashOnCompletion ||
                provider.paymentOptions?.cardOnCompletion) && (
                <div className="flex items-center gap-1 flex-wrap">
                  {provider.businessType !== "individual" && provider.vatNumber && (
                    <span className="text-[0.5625rem] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-px rounded-full dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                      VAT Registered
                    </span>
                  )}
                  {response.isInsuranceRegistered && (
                    <span className="inline-flex items-center gap-0.5 text-[0.5625rem] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-px rounded-full dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      <ShieldCheck size={8} />
                      Insurance Approved
                    </span>
                  )}
                  {/* Flexible Payment Options v1.2 — Cash on Completion badge */}
                  {provider.paymentOptions?.cashOnCompletion &&
                    (provider.enforcement?.stage || 0) < 3 && (
                      <span className="text-[0.5625rem] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-px rounded-full dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                        Cash Accepted
                      </span>
                    )}
                  {/* Flexible Payment Options v1.2 — Pay After Service badge */}
                  {provider.paymentOptions?.cardOnCompletion && (
                    <span className="text-[0.5625rem] font-medium bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-px rounded-full dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                      Pay After
                    </span>
                  )}
                </div>
              )}
              {provider.distance && (
                <div style={{ fontSize: ".6875rem" }} className="text-slate-400 dark:text-slate-500">
                  {provider.distance} away
                </div>
              )}
            </>
          )}
        </div>

        {/* Service Column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: ".5rem",
            justifyContent: "center",
            paddingTop: isBest || isAccepted ? "1.625rem" : undefined,
          }}
          className="px-3 py-3 sm:px-4 sm:py-5"
        >
          {/* Service pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              padding: ".2rem .625rem",
              borderRadius: "9999px",
              fontSize: ".6875rem",
              fontWeight: 600,
              width: "fit-content",
            }}
            className={serviceType === "workshop"
              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {serviceType === "workshop" ? (
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              ) : (
                <>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </>
              )}
            </svg>
            {locType}
          </div>

          <div
            style={{ fontSize: ".9375rem", fontWeight: 700, lineHeight: 1.5 }}
            className="text-slate-900 dark:text-white"
          >
            {svcLines.map((line, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span>{line}</span>
                {i === 0 && isTierMode && <InfoIconButton />}
              </div>
            ))}
          </div>

          {estimatedDuration ? (
            <div
              style={{
                fontSize: ".8125rem",
                lineHeight: 1.5,
                display: "inline-flex",
                alignItems: "center",
                gap: ".375rem",
              }}
              className="text-slate-500 dark:text-slate-400"
            >
              <Clock size={13} />
              Service Duration: {formatDuration(estimatedDuration)}
            </div>
          ) : null}
        </div>

        {/* Timing Column — hidden on small screens */}
        <div
          style={{
            padding: "1.25rem .875rem",
            paddingTop: isBest || isAccepted ? "calc(1.625rem + 1.25rem)" : "1.25rem",
            alignItems: "center",
            gap: ".625rem",
            flexShrink: 0,
          }}
          className="hidden md:flex border-x border-dashed border-slate-200 dark:border-slate-700"
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: ".5625rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".04em",
                marginBottom: ".25rem",
              }}
              className="text-slate-400 dark:text-slate-500"
            >
              Type
            </div>
            <div
              style={{ fontSize: ".875rem", fontWeight: 700 }}
              className="text-slate-800 dark:text-slate-200"
            >
              {locShort}
            </div>
            <div
              style={{
                fontSize: ".625rem",
                marginTop: ".125rem",
              }}
              className="text-slate-500 dark:text-slate-400"
            >
              {locType}
            </div>
          </div>

          {estimatedDuration && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "0 .25rem",
              }}
            >
              <div
                style={{
                  fontSize: ".5625rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
                className="text-slate-400 dark:text-slate-500"
              >
                {formatDuration(estimatedDuration)}
              </div>
              <div
                style={{
                  width: 24,
                  height: 1,
                }}
                className="bg-slate-300 dark:bg-slate-600"
              />
            </div>
          )}

          {etaText && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: ".5625rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  marginBottom: ".25rem",
                }}
                className="text-slate-400 dark:text-slate-500"
              >
                Earliest
              </div>
              <div
                style={{
                  fontSize: ".875rem",
                  fontWeight: 700,
                }}
                className="text-slate-800 dark:text-slate-200"
              >
                {etaText}
              </div>
            </div>
          )}
        </div>

        {/* Price + CTA Column */}
        <div
          style={{
            flexShrink: 0,
            gap: ".625rem",
            paddingTop: isBest || isAccepted ? "1.625rem" : undefined,
          }}
          className={`flex flex-col justify-center ${response.isInsuranceRegistered ? "items-stretch sm:w-[210px]" : "items-center sm:items-end sm:w-[148px]"} border-t sm:border-t-0 border-dashed border-slate-200 dark:border-slate-700 p-3 sm:p-[1.125rem]`}
        >
          {/* Price */}
          <div className={`${response.isInsuranceRegistered ? "w-full" : "text-center sm:text-right"}`}>
            {response.isInsuranceRegistered ? (
              <div style={{ width: "100%" }}>
                {/* Table-style breakdown */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".8125rem", textAlign: "left" }}>
                  <tbody>
                    {response.insuranceDetails?.totalJobValue != null && (
                      <tr>
                        <td style={{ padding: ".1875rem 0", whiteSpace: "nowrap", textAlign: "left" }} className="text-slate-500 dark:text-slate-400">Total job</td>
                        <td style={{ padding: ".1875rem 0", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }} className="text-slate-700 dark:text-slate-300">R {response.insuranceDetails.totalJobValue.toLocaleString()}</td>
                      </tr>
                    )}
                    {response.insuranceDetails?.totalJobValue != null && (
                      <tr>
                        <td style={{ padding: ".1875rem 0", whiteSpace: "nowrap", textAlign: "left" }} className="text-slate-500 dark:text-slate-400">Insurer covers</td>
                        <td style={{ padding: ".1875rem 0", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }} className="text-emerald-600 dark:text-emerald-400">R {(response.insuranceDetails.insurerClaimAmount ?? (response.insuranceDetails.totalJobValue - price)).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: ".375rem 0 .125rem", whiteSpace: "nowrap", textAlign: "left", borderTop: "1px dashed #e2e8f0" }} className="text-emerald-700 dark:text-emerald-300 font-semibold">You pay</td>
                      <td style={{ padding: ".375rem 0 .125rem", textAlign: "right", whiteSpace: "nowrap", borderTop: "1px dashed #e2e8f0" }} className="text-emerald-600 dark:text-emerald-400">
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-.02em" }}>
                          {price > 0 ? `R ${price.toLocaleString()}` : "R 0"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontSize: ".6875rem", marginTop: ".25rem", textAlign: "right" }} className="text-emerald-500 dark:text-emerald-500 font-medium">
                  {price === 0 ? "Fully covered by insurer" : "Excess only"}
                </div>
              </div>
            ) : (
              <>
                <div>
                  {isTierMode && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">From</span>
                  )}
                  <span
                    style={{ fontSize: ".9375rem", fontWeight: 600 }}
                    className="text-slate-900 dark:text-white"
                  >
                    R
                  </span>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      letterSpacing: "-.02em",
                      lineHeight: 1,
                    }}
                    className="text-slate-900 dark:text-white"
                  >
                    {price ? price.toLocaleString() : "0"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: ".625rem",
                    marginTop: ".25rem",
                  }}
                  className="text-slate-400 dark:text-slate-500"
                >
                  {isTierMode ? "Lowest tier" : "Service amount"}
                </div>
              </>
            )}
          </div>

          {/* Accept Button — hide in tier mode (moves to tier-picker section below) */}
          {!isTierMode && !isAccepted && !isRejected && !disabled && !isProviderDeleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: ".5625rem .875rem",
                borderRadius: ".75rem",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                color: "#fff",
                fontSize: ".875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow:
                  "0 1px 3px rgba(15,23,42,.06), 0 1px 2px -1px rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.15)",
                transition: "all 150ms cubic-bezier(.4,0,.2,1)",
                whiteSpace: "nowrap",
              }}
              className="w-full flex items-center justify-center hover:shadow-lg hover:-translate-y-px"
            >
              {(() => {
                // Insurance R0 — straight confirm
                if (
                  response.isInsuranceRegistered &&
                  (response.insuranceDetails?.customerExcess === 0 ||
                    response.price === 0)
                ) {
                  return "Accept & Confirm";
                }
                // Flexible Payment Options v1.2 — when provider supports cash
                // and/or card-after-service in addition to prepayment, the next
                // step is the payment-method picker, not Paystack. Insurance
                // quotes always go straight to Paystack.
                const isInsuranceResponse =
                  response?.isInsuranceRegistered;
                const cashAvailable =
                  !!provider?.paymentOptions?.cashOnCompletion &&
                  (provider?.enforcement?.stage || 0) < 3;
                const cardAfterAvailable =
                  !!provider?.paymentOptions?.cardOnCompletion;
                if (
                  !isInsuranceResponse &&
                  (cashAvailable || cardAfterAvailable)
                ) {
                  return "Accept Quote";
                }
                return "Accept & Pay";
              })()}
            </button>
          )}

          {/* Expire timer */}
          {timeLeft && !isAccepted && !isRejected && (
            <div
              style={{
                fontSize: ".625rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: ".25rem",
              }}
              className={isUrgent ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}
            >
              <Clock size={10} />
              {timeLeft}
            </div>
          )}

          {/* Rejected label */}
          {isRejected && (
            <span
              style={{
                padding: ".25rem .75rem",
                fontSize: ".75rem",
                fontWeight: 600,
                borderRadius: "9999px",
              }}
              className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              Not Selected
            </span>
          )}
        </div>
      </div>

      {/* ── Tier Picker (NEW, only in tier mode) ── */}
      {isTierMode && !isAccepted && !isRejected && !disabled && !isProviderDeleted && (
        <div className="px-3 sm:px-5 py-4 sm:py-5 border-b border-dashed border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Choose your glass quality
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {orderedTiers.map((tier) => {
              const isSelected = selectedQuality === tier.quality;
              const isDimmed = selectedQuality !== null && !isSelected;
              const labels = QUALITY_LABELS[tier.quality] || { short: tier.quality, full: tier.quality };

              // Insurance-aware price display
              const isInsuranceTier =
                response.isInsuranceRegistered &&
                typeof tier.customerExcess === "number";
              const headlinePrice = isInsuranceTier ? tier.customerExcess : tier.price;
              const insurerCovers = isInsuranceTier
                ? (tier.insurerClaimAmount ?? ((tier.totalJobValue ?? 0) - (tier.customerExcess ?? 0)))
                : null;

              return (
                <button
                  key={tier.quality}
                  type="button"
                  onClick={() => setSelectedQuality(tier.quality)}
                  disabled={isDimmed}
                  className={`text-left p-3 rounded-[14px] border-[1.5px] transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/40 dark:bg-blue-900/20 ring-2 ring-blue-500/30"
                      : isDimmed
                        ? "border-slate-200 dark:border-slate-700 opacity-55 cursor-not-allowed"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                  title={labels.full}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {labels.short}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold uppercase text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {headlinePrice === 0 && isInsuranceTier
                      ? <span className="text-emerald-600 dark:text-emerald-400 text-sm">Fully covered by insurer</span>
                      : <>R {(headlinePrice || 0).toLocaleString()}</>
                    }
                  </div>
                  {isInsuranceTier && headlinePrice > 0 && insurerCovers > 0 && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                      Insurer covers R {insurerCovers.toLocaleString()}
                    </div>
                  )}
                  {tier.warranty && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {tier.warranty} warranty
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Accept & Pay button — only when a tier is selected */}
          {selectedQuality && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(selectedQuality);
                }}
                style={{
                  padding: ".5625rem 1.25rem",
                  borderRadius: ".75rem",
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  color: "#fff",
                  fontSize: ".875rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                className="flex items-center justify-center hover:shadow-lg hover:-translate-y-px transition-all"
              >
                {(() => {
                  const tier = orderedTiers.find((t) => t.quality === selectedQuality);
                  const tierPrice = response.isInsuranceRegistered
                    ? tier?.customerExcess ?? 0
                    : tier?.price ?? 0;

                  // R0 insurance → Accept & Confirm
                  if (response.isInsuranceRegistered && tierPrice === 0) {
                    return "Accept & Confirm";
                  }

                  // Provider offers cash/card-after → defer to payment-method picker
                  const cashAvailable =
                    !!response.provider?.paymentOptions?.cashOnCompletion &&
                    (response.provider?.enforcement?.stage || 0) < 3;
                  const cardAfterAvailable =
                    !!response.provider?.paymentOptions?.cardOnCompletion;
                  if (!response.isInsuranceRegistered && (cashAvailable || cardAfterAvailable)) {
                    return "Accept Quote";
                  }

                  return `Accept & Pay  R ${tierPrice.toLocaleString()}`;
                })()}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Accepted-state collapse view (NEW, only in tier mode AFTER acceptance) ── */}
      {isTierMode && isAccepted && (
        <div className="px-3 sm:px-5 py-3 border-b border-dashed border-slate-200 dark:border-slate-700 bg-emerald-50/40 dark:bg-emerald-900/10">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Glass quality selected
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {orderedTiers.map((tier) => {
              const isSelected =
                quoteData?.booking?.selectedGlassQuality === tier.quality;
              const labels = QUALITY_LABELS[tier.quality] || { short: tier.quality };
              const isInsuranceTier =
                response.isInsuranceRegistered &&
                typeof tier.customerExcess === "number";
              const displayPrice = isInsuranceTier ? tier.customerExcess : tier.price;
              return (
                <div
                  key={tier.quality}
                  className={`text-sm ${
                    isSelected
                      ? "font-bold text-emerald-700 dark:text-emerald-300"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {labels.short} —{" "}
                  {isInsuranceTier && (displayPrice || 0) === 0 ? (
                    <span>Fully covered</span>
                  ) : (
                    <>R {(displayPrice || 0).toLocaleString()}</>
                  )}
                  {isSelected && <Check size={14} className="inline ml-1" />}
                  {!isSelected && <span className="text-[11px] ml-1">(not selected)</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          flexWrap: "wrap",
        }}
        className="flex items-center gap-2 sm:gap-4 px-3 py-2.5 sm:px-5 sm:py-3.5"
      >
        {/* Warranty */}
        {glassDetails?.warranty && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-green-600 dark:text-green-400"
          >
            <Shield size={12} className="text-green-500 dark:text-green-400" />
            {glassDetails.warranty} warranty
          </div>
        )}

        {/* Glass quality */}
        {glassDetails?.quality && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-blue-600 dark:text-blue-400"
          >
            <Check size={12} className="text-blue-500 dark:text-blue-400" />
            {glassDetails.quality === "OEM"
              ? "OEM Glass"
              : glassDetails.quality === "OEE"
                ? "OEE Glass"
                : "Aftermarket"}
          </div>
        )}

        {/* Service area — workshop shows workshop address, mobile shows service area */}
        {(provider.serviceAreas?.length > 0 ||
          provider.serviceArea ||
          provider.address?.city) && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-slate-400 dark:text-slate-500"
          >
            <MapPin size={12} />
            {(() => {
              // Workshop service — show workshop address
              if (isWorkshopService && provider.serviceArea?.workshopAddress) {
                const ws = provider.serviceArea.workshopAddress;
                const parts = [ws.addressLine1, ws.suburb, ws.city, ws.province].filter(Boolean);
                if (parts.length > 0) return parts.join(", ");
              }
              // Also check response-level workshop address
              if (isWorkshopService && response.workshopAddress) {
                const ws = response.workshopAddress;
                const parts = [ws.addressLine1, ws.city, ws.province].filter(Boolean);
                if (parts.length > 0) return parts.join(", ");
              }
              // Mobile / fallback — show service area
              if (Array.isArray(provider.serviceAreas) && provider.serviceAreas.length > 0)
                return provider.serviceAreas.join(", ");
              if (typeof provider.serviceArea === "object") {
                if (provider.serviceArea?.address?.city) return provider.serviceArea.address.city;
                const cities = provider.serviceArea?.cities;
                if (Array.isArray(cities) && cities.length > 0) {
                  const requestedCity = quoteData?.location?.city || quoteData?.serviceLocation?.address?.city;
                  if (requestedCity) {
                    const match = cities.find(
                      (c) => c.toLowerCase() === requestedCity.toLowerCase()
                    );
                    if (match) return match;
                  }
                  return cities[0];
                }
              }
              if (provider.address?.city) return provider.address.city;
              return typeof provider.serviceArea === "string" ? provider.serviceArea : null;
            })()}
          </div>
        )}

        {/* ETA */}
        {etaText && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-slate-400 dark:text-slate-500"
          >
            <Clock size={12} />
            {etaText}
          </div>
        )}

        {/* Provider Phone — only after payment confirmed */}
        {isAccepted && bookingConfirmed && !isProviderDeleted && provider.phone && (
          <a
            href={`tel:${provider.phone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".75rem",
              fontWeight: 600,
              marginLeft: "auto",
            }}
            className="text-blue-600 dark:text-indigo-400"
          >
            <Phone size={12} />
            {provider.phone}
          </a>
        )}

        {/* Counter offer label in footer */}
        {responseType === "Counter" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle size={12} className="text-amber-500 dark:text-amber-400" />
            Counter offer
          </div>
        )}

        {/* Insurance claim note — insurance-registered providers */}
        {response.isInsuranceRegistered && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-emerald-600 dark:text-emerald-400"
          >
            <Shield size={12} className="text-emerald-500 dark:text-emerald-400" />
            This provider handles your insurance claim directly
          </div>
        )}

        {/* Non-registered provider on insurance quote — payment note */}
        {quoteData?.hasInsurance && !response.isInsuranceRegistered && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
            }}
            className="text-slate-400 dark:text-slate-500"
          >
            <Wallet size={12} />
            Full payment — claim from insurer with receipt
          </div>
        )}

        {/* Response ref */}
        {response.reference && (
          <div
            style={{
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: ".625rem",
            }}
            className="text-slate-300 dark:text-slate-600"
          >
            {response.reference}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderResponseCard;
