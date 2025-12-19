import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  inputClassName = '',
  required,
  ...props
}, ref) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2.5 border rounded-lg text-sm
            transition-colors duration-200
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'}
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${inputClassName}
          `}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={18} />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;


