import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  footer?: ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  footer
}: ModalProps) => {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Manejar ESC para cerrar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const getSizeStyles = (size: string) => {
    const styles = {
      sm: 'max-w-sm w-full sm:w-auto',
      md: 'max-w-md w-full sm:w-auto', 
      lg: 'max-w-2xl w-full',
      xl: 'max-w-4xl w-full',
      '2xl': 'max-w-6xl w-full',
      full: 'w-full h-full max-w-none'
    };
    return styles[size as keyof typeof styles] || styles.md;
  };

  const getHeightStyles = (size: string) => {
    if (size === 'full') {
      return 'h-full';
    }
    return 'max-h-[90vh] sm:max-h-[85vh]';
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop mejorado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Modal Container con scroll */}
          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`
                relative bg-white border border-gray-200 rounded-2xl shadow-2xl
                ${getSizeStyles(size)}
                ${getHeightStyles(size)}
                ${className}
                flex flex-col
              `}
            >
              {/* Header fijo */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                  {title && (
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 pr-4">
                      {title}
                    </h3>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-xl transition-all duration-200 flex-shrink-0"
                      aria-label="Cerrar modal"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Content con scroll */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-4 sm:p-6">
                  {children}
                </div>
              </div>

              {/* Footer fijo */}
              {footer && (
                <div className="p-4 sm:p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};