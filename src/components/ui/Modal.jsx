import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  className = ''
}) => {
  const modalRef = useRef(null);
  
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
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          tabIndex={-1}
          className={`
            relative w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl
            animate-scale-in
            ${sizeClasses[size]}
            ${className}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalActions = ({ children, className = '' }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 ${className}`}>
    {children}
  </div>
);

export default Modal;


