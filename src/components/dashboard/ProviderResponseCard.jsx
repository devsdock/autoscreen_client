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
    if (totalHours > 0) return `${totalHours}h ${mins}m left`;
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
        background: "#fff",
        border: `1.5px solid ${isAccepted ? "#22C55E" : isRejected ? "#E2E8F0" : "#E2E8F0"}`,
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
      className="hover:shadow-xl hover:-translate-y-0.5 hover:border-primary-200 dark:bg-slate-800 dark:border-slate-700"
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
          display: "flex",
          alignItems: "stretch",
          borderBottom: "1px dashed #E2E8F0",
          paddingTop: isBest || isAccepted ? "1.625rem" : 0,
        }}
        className="flex-col sm:flex-row dark:border-slate-700"
      >
        {/* Provider Column */}
        <div
          style={{
            width: "auto",
            flexShrink: 0,
            padding: "1.25rem 1rem 1.25rem 1.25rem",
            borderRight: "1px dashed #E2E8F0",
            background: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            gap: ".5rem",
            justifyContent: "center",
          }}
          className="!border-b sm:!border-b-0 sm:w-[160px] dark:bg-slate-800/50 dark:border-slate-700"
        >
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
          <div
            style={{
              fontSize: ".9375rem",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.2,
            }}
            className="dark:text-white"
          >
            {displayName}
          </div>
          {provider.businessType && (
            <div style={{ fontSize: ".75rem", color: "#64748B" }}>
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
              color: "#334155",
            }}
            className="dark:text-slate-300"
          >
            <Star
              size={11}
              style={{ fill: "#F59E0B", color: "#F59E0B" }}
            />
            {(provider.rating || 0).toFixed(1)}
            {provider.reviewsCount > 0 && (
              <span
                style={{
                  color: "#94A3B8",
                  fontWeight: 400,
                  fontSize: ".6875rem",
                }}
              >
                ({provider.reviewsCount})
              </span>
            )}
          </div>
          {provider.distance && (
            <div style={{ fontSize: ".6875rem", color: "#94A3B8" }}>
              {provider.distance} away
            </div>
          )}
        </div>

        {/* Service Column */}
        <div
          style={{
            flex: 1,
            padding: "1.25rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: ".5rem",
            justifyContent: "center",
          }}
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
              background:
                serviceType === "workshop" ? "#EDE9FE" : "#FEF3C7",
              color:
                serviceType === "workshop" ? "#6D28D9" : "#D97706",
            }}
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
              color: "#0F172A",
              lineHeight: 1.5,
            }}
            className="dark:text-white"
          >
            {svcLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          {message ? (
            <div
              style={{
                fontSize: ".8125rem",
                color: "#64748B",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {message}
            </div>
          ) : (response.notes && (
            <div
              style={{
                fontSize: ".8125rem",
                color: "#64748B",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {response.notes}
            </div>
          ))}
        </div>

        {/* Timing Column — hidden on small screens */}
        <div
          style={{
            padding: "1.25rem .875rem",
            borderRight: "1px dashed #E2E8F0",
            borderLeft: "1px dashed #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: ".625rem",
            flexShrink: 0,
          }}
          className="hidden md:flex dark:border-slate-700"
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: ".5625rem",
                fontWeight: 600,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: ".04em",
                marginBottom: ".25rem",
              }}
            >
              Type
            </div>
            <div
              style={{ fontSize: ".875rem", fontWeight: 700, color: "#1E293B" }}
              className="dark:text-slate-200"
            >
              {locShort}
            </div>
            <div
              style={{
                fontSize: ".625rem",
                color: "#64748B",
                marginTop: ".125rem",
              }}
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
                  color: "#94A3B8",
                  whiteSpace: "nowrap",
                }}
              >
                {estimatedDuration} min
              </div>
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: "#CBD5E1",
                }}
              />
            </div>
          )}

          {etaText && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: ".5625rem",
                  fontWeight: 600,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  marginBottom: ".25rem",
                }}
              >
                Earliest
              </div>
              <div
                style={{
                  fontSize: ".875rem",
                  fontWeight: 700,
                  color: "#1E293B",
                }}
                className="dark:text-slate-200"
              >
                {etaText}
              </div>
            </div>
          )}
        </div>

        {/* Price + CTA Column */}
        <div
          style={{
            width: "auto",
            flexShrink: 0,
            padding: "1.125rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: ".625rem",
          }}
          className="sm:w-[148px]"
        >
          {/* Price */}
          <div style={{ textAlign: "right" }}>
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
                color: "#94A3B8",
                marginTop: ".25rem",
              }}
            >
              incl. VAT · Full payment
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
                width: "100%",
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
              }}
              className="hover:shadow-lg hover:-translate-y-px"
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
                color: isUrgent ? "#DC2626" : "#94A3B8",
                display: "flex",
                alignItems: "center",
                gap: ".25rem",
              }}
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
                background: "#F1F5F9",
                color: "#64748B",
                fontSize: ".75rem",
                fontWeight: 600,
                borderRadius: "9999px",
              }}
            >
              Not Selected
            </span>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: ".875rem 1.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
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
              color: "#16A34A",
            }}
          >
            <Shield size={12} style={{ color: "#22C55E" }} />
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
              color: "#2563EB",
            }}
          >
            <Check size={12} style={{ color: "#3B82F6" }} />
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
              color: "#94A3B8",
            }}
          >
            <MapPin size={12} />
            {Array.isArray(provider.serviceAreas)
              ? provider.serviceAreas.join(", ")
              : provider.serviceArea || provider.address?.city}
          </div>
        )}

        {/* ETA on mobile */}
        {etaText && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
              color: "#94A3B8",
            }}
            className="md:hidden"
          >
            <Clock size={12} />
            {etaText}
          </div>
        )}

        {/* Duration on mobile */}
        {estimatedDuration && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".375rem",
              fontSize: ".6875rem",
              fontWeight: 600,
              color: "#94A3B8",
            }}
            className="md:hidden"
          >
            {estimatedDuration} min
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
              color: "#2563EB",
              marginLeft: "auto",
            }}
            className="hover:text-primary-700 dark:text-primary-400"
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
              color: "#D97706",
            }}
          >
            <AlertTriangle size={12} style={{ color: "#F59E0B" }} />
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
              color: "#CBD5E1",
            }}
          >
            {response.reference}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderResponseCard;
