import { useState } from "react";
import { Eye, Wrench, Hammer, Sun, Briefcase } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { formatServiceType, formatGlassType } from "../../utils/dataMappers";

/**
 * ServiceInfoCell - A reusable component for displaying service and glass types in tables
 * Handles both simple and complex service selections with a "View" modal for clarity.
 */
const ServiceInfoCell = ({ row, className = "" }) => {
  // Extract services logic to handle legacy and new data formats
  const services = [];

  if (row.serviceSelections?.length > 0) {
    row.serviceSelections.forEach((sel) => {
      services.push({
        name: sel.serviceName || formatServiceType(sel.serviceType),
        glass: sel.glassTypes?.map(formatGlassType).join(", ") || "",
        type: sel.serviceType,
      });
    });
  } else {
    // Handle legacy data format
    const serviceNames = row.serviceTypes?.length
      ? row.serviceTypes.map(formatServiceType)
      : [formatServiceType(row.serviceType)];

    const glassNames = row.glassTypes?.length
      ? row.glassTypes.map(formatGlassType).join(", ")
      : formatGlassType(row.glassType);

    serviceNames.forEach((name, idx) => {
      services.push({
        name,
        glass: idx === 0 ? glassNames : "",
        type: Array.isArray(row.serviceTypes)
          ? row.serviceTypes[idx]
          : row.serviceType,
      });
    });
  }

  if (services.length === 0)
    return <span className="text-slate-400 text-xs">-</span>;

  return (
    <div className={`flex flex-col gap-1.5 py-1 ${className}`}>
      {services.map((s, idx) => (
        <div key={idx} className="flex flex-col leading-tight">
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">
            {s.name}
          </span>
          {s.glass &&
            s.glass !== "No glass specified" &&
            s.glass !== "See above" && (
              <span className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {s.glass}
              </span>
            )}
        </div>
      ))}
    </div>
  );
};

export default ServiceInfoCell;
