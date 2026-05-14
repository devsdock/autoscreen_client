import { useState, useEffect } from "react";
import { ShieldCheck, Check, ArrowLeft, ArrowRight } from "lucide-react";
import Modal from "../ui/Modal";

const TIER_DATA = {
  OEM: {
    fullName: "Original Equipment Manufacturer",
    intro:
      "OEM auto glass is manufactured by the same company that produced the original glass installed in your vehicle when it left the factory.",
    keyFeatures: [
      "Matches the original glass exactly",
      "Same thickness, tint, shape, and specifications",
      "Often includes original branding or manufacturer markings",
      "Designed to fit perfectly with vehicle sensors, cameras, and ADAS systems",
    ],
    advantages: [
      "Highest quality and precision fit",
      "Best compatibility with modern safety systems",
      "Maintains original factory standards",
      "Preferred for luxury and newer vehicles",
    ],
    bestFor: [
      "New vehicles",
      "Luxury cars",
      "Vehicles with advanced driver assistance systems (ADAS)",
      "Customers wanting factory-standard replacements",
    ],
  },
  OEE: {
    fullName: "Original Equipment Equivalent",
    intro:
      "OEE glass is manufactured to closely match OEM standards but is produced by a different manufacturer than the original supplier.",
    keyFeatures: [
      "Similar quality and specifications to OEM",
      "Meets industry safety standards",
      "Designed for proper fit and performance",
      "Usually does not carry the vehicle manufacturer's logo",
    ],
    advantages: [
      "More affordable than OEM",
      "Good quality and reliability",
      "Widely available",
      "Suitable for most vehicle replacements",
    ],
    bestFor: [
      "Everyday vehicle owners",
      "Insurance-approved repairs",
      "Customers seeking a balance between quality and affordability",
    ],
  },
  Generic: {
    fullName: "Generic / Aftermarket Glass",
    intro:
      "Generic auto glass is produced by third-party manufacturers and is generally the most budget-friendly option.",
    keyFeatures: [
      "Manufactured independently of vehicle brands",
      "Built to basic safety requirements",
      "May vary in fit, clarity, thickness, and durability",
    ],
    advantages: [
      "Lowest replacement cost",
      "Easily available for many vehicle models",
      "Suitable for older vehicles or temporary replacements",
    ],
    bestFor: [
      "Older vehicles",
      "Budget-conscious customers",
      "Basic replacements where factory precision is not critical",
    ],
  },
};

const COMPARE_ROWS = [
  { label: "Quality", oem: "Highest", oee: "High", generic: "Varies" },
  {
    label: "Manufacturer",
    oem: "Original supplier",
    oee: "Alternative certified supplier",
    generic: "Third-party manufacturer",
  },
  {
    label: "Fit & Finish",
    oem: "Exact factory match",
    oee: "Very close to OEM",
    generic: "May vary",
  },
  { label: "Price", oem: "Highest", oee: "Moderate", generic: "Lowest" },
  {
    label: "Vehicle Branding",
    oem: "Usually included",
    oee: "Usually not included",
    generic: "No",
  },
  {
    label: "ADAS Compatibility",
    oem: "Excellent",
    oee: "Good",
    generic: "May vary",
  },
];

function TierTab({ data }) {
  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-300">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {data.fullName}
        </h3>
        <p className="text-sm leading-relaxed">{data.intro}</p>
      </div>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
          Key Features
        </h4>
        <ul className="space-y-1.5 text-sm">
          {data.keyFeatures.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
          Advantages
        </h4>
        <ul className="space-y-1.5 text-sm">
          {data.advantages.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
          Best For
        </h4>
        <ul className="space-y-1.5 text-sm">
          {data.bestFor.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CompareTab() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 px-2 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase">
              Feature
            </th>
            <th className="text-left py-2 px-2 font-semibold text-blue-600 dark:text-blue-400 text-xs uppercase">
              OEM
            </th>
            <th className="text-left py-2 px-2 font-semibold text-blue-600 dark:text-blue-400 text-xs uppercase">
              OEE
            </th>
            <th className="text-left py-2 px-2 font-semibold text-blue-600 dark:text-blue-400 text-xs uppercase">
              Generic
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr
              key={row.label}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <td className="py-2 px-2 font-medium text-slate-900 dark:text-white">
                {row.label}
              </td>
              <td className="py-2 px-2 text-slate-700 dark:text-slate-300">
                {row.oem}
              </td>
              <td className="py-2 px-2 text-slate-700 dark:text-slate-300">
                {row.oee}
              </td>
              <td className="py-2 px-2 text-slate-700 dark:text-slate-300">
                {row.generic}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm space-y-1">
        <div>
          <strong className="text-slate-900 dark:text-white">OEM</strong> = Original
          factory-quality glass
        </div>
        <div>
          <strong className="text-slate-900 dark:text-white">OEE</strong> = Similar
          quality to OEM at a lower price
        </div>
        <div>
          <strong className="text-slate-900 dark:text-white">Generic</strong> =
          Budget-friendly aftermarket option
        </div>
      </div>
    </div>
  );
}

export default function GlassTypesExplainedModal({
  isOpen,
  onClose,
  initialTab = "OEM",
}) {
  // "view" is either one of the tier keys (OEM/OEE/Generic) — single-tier
  // focus — or "Compare" which swaps the body to the side-by-side table.
  const [view, setView] = useState(initialTab);

  // Reset to the caller-chosen tier every time the modal opens, so each
  // tier's pulse-icon click lands directly on its own explanation.
  useEffect(() => {
    if (isOpen) setView(initialTab);
  }, [isOpen, initialTab]);

  const isCompareView = view === "Compare";
  const tierData = !isCompareView ? TIER_DATA[view] || TIER_DATA.OEM : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-500" />
          {isCompareView
            ? "Glass Quality Comparison"
            : "Auto Glass Types Explained"}
        </span>
      }
      description={
        isCompareView
          ? "Side-by-side comparison of OEM, OEE, and Generic glass"
          : "Understanding OEM, OEE, and Generic glass"
      }
      size="lg"
    >
      {/* Flex-column layout with max-height so the WHOLE modal (Modal.jsx
          header + this body) stays within ~85vh on any screen size.
          The content area `flex-1 min-h-0 overflow-y-auto` is the
          ONLY part that scrolls — the footer button stays pinned. */}
      <div className="flex flex-col gap-4 max-h-[calc(85vh-130px)]">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {isCompareView ? <CompareTab /> : <TierTab data={tierData} />}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          {/* Toggle: tier view ↔ compare view */}
          {isCompareView ? (
            <button
              type="button"
              onClick={() => setView(initialTab)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors self-start sm:self-center"
            >
              <ArrowLeft size={14} />
              Back to {initialTab === "Generic" ? "Generic" : initialTab}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setView("Compare")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors self-start sm:self-center"
            >
              Compare all three tiers
              <ArrowRight size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
}
