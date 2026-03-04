import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, Loader2 } from "lucide-react";

const PremiumSelect = ({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  error,
  icon: Icon,
  isSearchable = false, // New: Input-based inline search
  searchable = false, // Legacy: Menu-based search bar
  disabled = false,
  loading = false,
  emptyMessage = "No options found",
  required = false,
  autoOpen = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when opening searchable select
  useEffect(() => {
    if (isOpen && isSearchable && inputRef.current) {
      // Small timeout to ensure the element is focusable after render/animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  // Helper to get string value from polymorphic option
  const getOptValue = (opt) => {
    if (typeof opt === "object" && opt !== null) {
      return opt.value !== undefined
        ? opt.value
        : opt.id !== undefined
          ? opt.id
          : String(opt);
    }
    return String(opt);
  };

  // Helper to get display label from polymorphic option
  const getOptLabel = (opt) => {
    if (typeof opt === "object" && opt !== null) {
      return opt.label || opt.name || String(getOptValue(opt));
    }
    return String(opt);
  };

  useEffect(() => {
    if (autoOpen && !disabled && !loading) {
      setIsOpen(true);
      dropdownRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [autoOpen, disabled, loading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen((prev) => {
        if (prev) setSearchQuery("");
        return !prev;
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const filteredOptions = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return options;
    return options.filter((opt) => {
      const optLabel = getOptLabel(opt).toLowerCase();
      const optSubtitle = (
        typeof opt === "object" ? opt.subtitle || "" : ""
      ).toLowerCase();
      return optLabel.includes(search) || optSubtitle.includes(search);
    });
  }, [options, searchQuery]);

  // Determine what to display in a robust way
  const selectedOption = useMemo(() => {
    return options.find((opt) => getOptValue(opt) === value);
  }, [value, options]);

  const displayValue = selectedOption ? getOptLabel(selectedOption) : "";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {label}
            {required && <span className="text-danger-500">*</span>}
          </span>
          {loading && (
            <Loader2 size={14} className="animate-spin text-primary-500" />
          )}
        </label>
      )}

      <div className="relative">
        {isSearchable && !disabled && !loading ? (
          <div
            className={`w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl text-sm transition-all shadow-sm ${
              isOpen
                ? "ring-2 ring-primary-500/20 border-primary-500"
                : error
                  ? "border-danger-500"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            <input
              ref={inputRef}
              autoFocus={isOpen}
              type="text"
              value={isOpen ? searchQuery : displayValue}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder || "Search..."}
              className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 p-0 caret-primary-500"
            />
            <ChevronDown
              size={18}
              onClick={handleToggle}
              className={`text-slate-400 transition-transform duration-200 cursor-pointer flex-shrink-0 ml-2 ${isOpen ? "rotate-180 text-primary-500" : ""}`}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800 border rounded-xl text-sm transition-all text-left ${
              isOpen
                ? "ring-2 ring-primary-500/20 border-primary-500 bg-white dark:bg-slate-800"
                : error
                  ? "border-danger-500"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            } ${disabled || loading ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" : "cursor-pointer shadow-sm"} ${
              autoOpen && !isOpen && !value
                ? "ring-2 ring-primary-500/50 animate-pulse"
                : ""
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {Icon && (
                <Icon
                  size={16}
                  className={`${isOpen ? "text-primary-500" : "text-slate-400"} hidden sm:block`}
                />
              )}
              <span
                className={`truncate ${!value ? "text-slate-400" : "text-slate-900 dark:text-slate-100 font-medium"}`}
              >
                {displayValue || placeholder}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary-500" : ""}`}
            />
          </button>
        )}

        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-200 min-w-[200px]">
            {searchable && !isSearchable && (
              <div className="p-2 border-b border-slate-50 dark:border-slate-700/50">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none dark:text-slate-200"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const optValue = getOptValue(opt);
                  const optLabel = getOptLabel(opt);
                  const optSubtitle =
                    typeof opt === "object" ? opt.subtitle : null;
                  const isOptDisabled =
                    typeof opt === "object" ? opt.disabled : false;

                  return (
                    <button
                      key={optValue || idx}
                      type="button"
                      disabled={isOptDisabled}
                      onClick={() => {
                        onChange(optValue);
                        handleClose();
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                        value === optValue
                          ? "text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/50 dark:bg-primary-900/5"
                          : isOptDisabled
                            ? "opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/20"
                            : "text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/10"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="truncate">{optLabel}</span>
                        {optSubtitle && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                            {optSubtitle}
                          </span>
                        )}
                      </div>
                      {value === optValue && (
                        <Check size={16} className="flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {emptyMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-500 ml-1">{error}</p>}
    </div>
  );
};

export default PremiumSelect;
