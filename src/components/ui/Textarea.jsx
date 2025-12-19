import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  textareaClassName = '',
  required,
  rows = 4,
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
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3 py-2.5 border rounded-lg text-sm
          transition-colors duration-200
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'}
          ${textareaClassName}
        `}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;



