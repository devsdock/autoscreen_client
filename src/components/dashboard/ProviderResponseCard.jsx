import {
  Star,
  BadgeCheck,
  Clock,
  MapPin,
  Shield,
  Check,
  Wrench,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "../../store/useDashboardStore";
import { formatDuration } from "../../utils/formatDuration";
import { NodeURL } from "../../services/api";

const ProviderResponseCard = ({
  response,
  onAccept,
  onMessage,
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

  const initials = (provider.businessName || provider.name || "P")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Resolve provider avatar URL
  const providerAvatarUrl = (() => {
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

  const displayName = ["company", "franchise", "Business"].includes(
    provider.businessType || provider.type
  )
    ? provider.businessName || provider.name
    : provider.name || "Provider";

  const isBest = response._bestValue;
  const locType = serviceType === "workshop" ? "Workshop" : "Mobile";
  const locShort = serviceType === "workshop" ? "WS" : "MOB";

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
        style={{
          paddingTop: isBest || isAccepted ? "1.625rem" : 0,
        }}
        className="flex flex-col sm:flex-row items-stretch border-b border-dashed border-slate-200 dark:border-slate-700"
      >
        {/* Provider Column */}
        <div
          style={{
            flexShrink: 0,
            gap: ".5rem",
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
          {provider.businessType && (
            <div style={{ fontSize: ".75rem" }} className="text-slate-500 dark:text-slate-400">
              {provider.businessType === "company" ||
              provider.businessType === "franchise"
                ? "Franchise Workshop"
                : "Independent Fitter"}
            </div>
          )}
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
          {provider.distance && (
            <div style={{ fontSize: ".6875rem" }} className="text-slate-400 dark:text-slate-500">
              {provider.distance} away
            </div>
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
            style={{
              fontSize: ".9375rem",
              fontWeight: 700,
              lineHeight: 1.5,
            }}
            className="text-slate-900 dark:text-white"
          >
            {svcLines.map((line, i) => (
              <div key={i}>{line}</div>
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
              Duration: {formatDuration(estimatedDuration)}
            </div>
          ) : null}
        </div>

        {/* Timing Column — hidden on small screens */}
        <div
          style={{
            padding: "1.25rem .875rem",
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
          }}
          className="flex flex-col justify-center items-center sm:items-end sm:w-[148px] border-t sm:border-t-0 border-dashed border-slate-200 dark:border-slate-700 p-3 sm:p-[1.125rem]"
        >
          {/* Price */}
          <div className="text-center sm:text-right">
            <div>
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
              Service amount
            </div>
          </div>

          {/* Accept Button */}
          {!isAccepted && !isRejected && !disabled && (
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
              className="w-full hover:shadow-lg hover:-translate-y-px"
            >
              Accept &amp; Pay
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

        {/* Service area */}
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
            {Array.isArray(provider.serviceAreas)
              ? provider.serviceAreas.join(", ")
              : provider.serviceArea || provider.address?.city}
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
        {isAccepted && bookingConfirmed && provider.phone && (
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
