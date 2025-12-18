import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary text-white hover:bg-dark-blue focus:ring-primary shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
  danger: 'bg-accent-red text-white hover:bg-red-700 focus:ring-accent-red shadow-sm',
  success: 'bg-success-green text-white hover:bg-green-700 focus:ring-success-green shadow-sm',
  outline: 'bg-transparent text-primary border border-primary/30 hover:bg-primary/5 focus:ring-primary',
  link: 'bg-transparent text-primary hover:text-dark-blue hover:underline p-0'
};

const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const isLink = variant === 'link';
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isLink ? 'rounded-xl' : ''}
        ${variants[variant]}
        ${!isLink ? sizes[size] : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
