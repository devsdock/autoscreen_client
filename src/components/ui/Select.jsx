import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  className = '',
  selectClassName = '',
  required,
  ...props
}, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 h-[40px] border rounded-[8px] text-sm
            appearance-none bg-white dark:bg-slate-800
            text-slate-900 dark:text-white
            transition-colors duration-200
            focus:outline-none focus:border-primary-500
            disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-600 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}
            ${selectClassName}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value || option} 
              value={option.value || option}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {option.label || option}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={18} />
        </div>
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;




