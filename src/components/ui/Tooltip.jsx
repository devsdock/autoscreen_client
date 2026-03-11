import { useState } from "react";

const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 300,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const handleTouch = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
      setTimeout(() => setIsVisible(false), 2000);
    }
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-800 dark:border-t-slate-700",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-800 dark:border-b-slate-700",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-800 dark:border-l-slate-700",
    right:
      "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-800 dark:border-r-slate-700",
  };

  if (!content) return children;

  return (
    <div
      className={`relative ${className || "inline-block"}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onTouchStart={handleTouch}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-[100] px-2 py-1.5
            text-[11px] font-medium leading-tight
            text-white bg-slate-900/95 dark:bg-slate-800/95
            rounded-lg shadow-xl backdrop-blur-sm
            whitespace-nowrap pointer-events-none
            animate-in fade-in zoom-in-95 duration-200
            ${positionClasses[position]}
          `}
          role="tooltip"
        >
          {content}
          <div
            className={`
              absolute border-4 border-transparent
              ${arrowClasses[position]}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
