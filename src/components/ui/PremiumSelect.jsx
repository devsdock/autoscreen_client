import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

const PremiumSelect = ({ 
  label, 
  value, 
  options = [], 
  onChange, 
  placeholder, 
  error, 
  icon: Icon, 
  searchable = false,
  disabled = false,
  loading = false,
  emptyMessage = "No options found",
  required = false,
  autoOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Helper to get string value from polymorphic option
  const getOptValue = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt.value !== undefined ? opt.value : opt.id !== undefined ? opt.id : String(opt);
    }
    return String(opt);
  };

  // Helper to get display label from polymorphic option
  const getOptLabel = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt.label || opt.name || String(getOptValue(opt));
    }
    return String(opt);
  };

  useEffect(() => {
    if (autoOpen && !disabled && !loading) {
      setIsOpen(true);
      dropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [autoOpen, disabled, loading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt => {
      const label = getOptLabel(opt);
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [options, searchable, searchQuery]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  // Determine what to display in a robust way
  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    
    // Find matching option to show label instead of raw value
    const match = options.find(opt => getOptValue(opt) === value);
    if (match) return getOptLabel(match);
    
    return value;
  }, [value, options, placeholder]);

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {label}{required && <span className="text-danger-500">*</span>}
          </span>
          {loading && <Loader2 size={14} className="animate-spin text-primary-500" />}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm transition-all text-left ${
            isOpen ? 'ring-2 ring-primary-500/20 border-primary-500 bg-primary-50/10' : 
            error ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          } ${disabled || loading ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : 'cursor-pointer shadow-sm'} ${
            autoOpen && !isOpen && !value ? 'ring-2 ring-primary-500/50 animate-pulse' : ''
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {Icon && <Icon size={16} className={`${isOpen ? 'text-primary-500' : 'text-slate-400'} hidden sm:block`} />}
            <span className={`truncate ${!value ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
              {displayValue}
            </span>
          </div>
          <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-500' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-200 min-w-[200px]">
            {searchable && (
              <div className="p-2 border-b border-slate-50 dark:border-slate-700/50">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const optValue = getOptValue(opt);
                  const optLabel = getOptLabel(opt);
                  return (
                    <button
                      key={optValue}
                      type="button"
                      onClick={() => {
                        onChange(optValue);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors ${
                        value === optValue ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/50 dark:bg-primary-900/5' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{optLabel}</span>
                      {value === optValue && <Check size={16} />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
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
