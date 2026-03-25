import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, Loader2, X } from "lucide-react";

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
  isCreatable = false,
  isClearable = false,
  hideArrow = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
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
        const next = !prev;
        if (next && isSearchable) {
          setSearchQuery(displayValue);
          setActiveIndex(-1);
        } else if (!next) {
          setSearchQuery("");
        }
        return next;
      });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    setActiveIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        handleToggle();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          const opt = filteredOptions[activeIndex];
          const isOptDisabled = typeof opt === "object" ? opt.disabled : false;
          if (!isOptDisabled) {
            onChange(getOptValue(opt));
            handleClose();
          }
        } else if (filteredOptions.length === 1) {
          // If only one result, select it on enter
          const opt = filteredOptions[0];
          const isOptDisabled = typeof opt === "object" ? opt.disabled : false;
          if (!isOptDisabled) {
            onChange(getOptValue(opt));
            handleClose();
          }
        } else if (filteredOptions.length > 0 && filteredOptions[0]._isCreatable) {
          onChange(filteredOptions[0].value);
          handleClose();
        }
        break;
      case "Escape":
        handleClose();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  const filteredOptions = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return options;
    const filtered = options.filter((opt) => {
      const optLabel = getOptLabel(opt).toLowerCase();
      const optSubtitle = (
        typeof opt === "object" ? opt.subtitle || "" : ""
      ).toLowerCase();
      return optLabel.includes(search) || optSubtitle.includes(search);
    });
    if (isCreatable && search) {
      const hasExactMatch = options.some((opt) => {
        const val = getOptValue(opt).toLowerCase();
        const label = getOptLabel(opt).toLowerCase();
        return val === search || label === search;
      });
      if (!hasExactMatch) {
        filtered.unshift({ value: searchQuery.trim(), label: "+ " + searchQuery.trim(), _isCreatable: true });
      }
    }
    return filtered;
  }, [options, searchQuery, isCreatable]);

  // Determine what to display in a robust way
  const selectedOption = useMemo(() => {
    return options.find((opt) => getOptValue(opt) === value);
  }, [value, options]);

  const displayValue = selectedOption ? getOptLabel(selectedOption) : (value || "");

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
            className={`w-full flex items-center justify-between px-4 h-[40px] bg-white dark:bg-slate-800 border rounded-[8px] text-sm transition-colors ${
              isOpen
                ? "border-primary-500"
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
              onFocus={() => {
                if (!isOpen) {
                  setIsOpen(true);
                  setSearchQuery(displayValue);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Search..."}
              className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400 p-0 caret-primary-500"
            />
            {isClearable && value && !isOpen && (
              <X
                size={16}
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer flex-shrink-0 ml-1"
              />
            )}
            {!hideArrow && (
              <ChevronDown
                size={18}
                onClick={handleToggle}
                className={`text-slate-400 transition-transform duration-200 cursor-pointer flex-shrink-0 ml-1 ${isOpen ? "rotate-180 text-primary-500" : ""}`}
              />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={`w-full flex items-center justify-between px-4 h-[40px] bg-white dark:bg-slate-800 border rounded-[8px] text-sm transition-colors text-left ${
              isOpen
                ? "border-primary-500"
                : error
                  ? "border-danger-500"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            } ${disabled || loading ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" : "cursor-pointer"} ${
              autoOpen && !isOpen && !value
                ? "border-primary-500 animate-pulse"
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
            <div className="flex items-center gap-1 flex-shrink-0">
              {isClearable && value && (
                <span
                  onClick={handleClear}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer flex items-center justify-center"
                >
                  <X size={14} />
                </span>
              )}
              {!hideArrow && (
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary-500" : ""}`}
                />
              )}
            </div>
          </button>
        )}

        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] shadow-lg z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-200 min-w-[200px]">
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
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-[8px] text-sm focus:outline-none focus:border-primary-500 dark:text-slate-200"
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
                        opt._isCreatable
                          ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/10 border-b border-slate-100 dark:border-slate-700"
                          : value === optValue
                            ? "text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/50 dark:bg-primary-900/5"
                            : idx === activeIndex
                              ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
