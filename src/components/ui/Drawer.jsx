import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  position = 'right',
  showCloseButton = true,
  closeOnOverlay = true,
  className = ''
}) => {
  const drawerRef = useRef(null);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };
  
  const positionClasses = {
    right: 'right-0 drawer-enter',
    left: 'left-0'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Drawer panel */}
      <div className={`fixed inset-y-0 ${positionClasses[position]} flex max-w-full`}>
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'drawer-title' : undefined}
          tabIndex={-1}
          className={`
            relative w-screen flex flex-col bg-white shadow-xl
            ${sizeClasses[size]}
            ${className}
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 flex-shrink-0">
            <div>
              {title && (
                <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DrawerFooter = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 p-5 border-t border-slate-100 bg-slate-50 ${className}`}>
    {children}
  </div>
);

export default Drawer;



