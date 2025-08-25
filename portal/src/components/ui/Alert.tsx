"use client";

import React, { forwardRef, useState } from "react";
import { motion, type Variants, type HTMLMotionProps, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del alert
const alertVariants = {
  default: [
    "bg-slate-50 border-slate-200 text-slate-800",
    "before:bg-slate-400"
  ].join(" "),
  
  info: [
    "bg-blue-50 border-blue-200 text-blue-800",
    "before:bg-blue-500"
  ].join(" "),
  
  success: [
    "bg-green-50 border-green-200 text-green-800",
    "before:bg-green-500"
  ].join(" "),
  
  warning: [
    "bg-amber-50 border-amber-200 text-amber-800",
    "before:bg-amber-500"
  ].join(" "),
  
  error: [
    "bg-red-50 border-red-200 text-red-800",
    "before:bg-red-500"
  ].join(" "),
  
  accent: [
    "bg-indigo-50 border-indigo-200 text-indigo-800",
    "before:bg-indigo-400"
  ].join(" ")
};

const sizeVariants = {
  sm: "p-3 text-sm",
  md: "p-4 text-sm",
  lg: "p-5 text-base"
};

// Iconos por defecto para cada variante
const defaultIcons = {
  default: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  accent: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
};

// Animaciones
const alertMotionVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const borderVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0
  },
  animate: {
    scaleX: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.1
    }
  }
};

const iconVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 25,
      delay: 0.2
    }
  }
};

const contentVariants: Variants = {
  initial: {
    opacity: 0,
    x: -10
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      delay: 0.3
    }
  }
};

export interface AlertProps extends Omit<HTMLMotionProps<"div">, "size"> {
  variant?: keyof typeof alertVariants;
  size?: keyof typeof sizeVariants;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  autoClose?: number; // milliseconds
  animated?: boolean;
  borderLeft?: boolean;
  children?: React.ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = "default",
    size = "md",
    title,
    description,
    icon,
    showIcon = true,
    closable = false,
    onClose,
    autoClose,
    animated = true,
    borderLeft = true,
    children,
    ...props
  }, ref) => {
    
    const [isVisible, setIsVisible] = useState(true);

    // Auto close functionality
    React.useEffect(() => {
      if (autoClose && autoClose > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        
        return () => clearTimeout(timer);
      }
    }, [autoClose]);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, animated ? 200 : 0);
    };

    const baseClasses = [
      // Base styles
      "relative border rounded-lg font-body",
      "shadow-sm",
      
      // Border left accent
      borderLeft && "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-lg",
      
      // Variants
      alertVariants[variant],
      sizeVariants[size]
    ].filter(Boolean).join(" ");

    const iconToShow = icon || (showIcon ? defaultIcons[variant] : null);

    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(baseClasses, className)}
            variants={animated ? alertMotionVariants : undefined}
            initial={animated ? "initial" : undefined}
            animate={animated ? "animate" : undefined}
            exit={animated ? "exit" : undefined}
            layout={animated}
            {...props}
          >
            {/* Border accent animation */}
            {borderLeft && animated && (
              <motion.div
                className="absolute left-0 top-0 h-full w-1 bg-current rounded-l-lg origin-left"
                variants={borderVariants}
              />
            )}
            
            <div className="flex items-start space-x-3">
              {/* Icon */}
              {iconToShow && (
                <motion.div
                  className="flex-shrink-0 mt-0.5"
                  variants={animated ? iconVariants : undefined}
                >
                  {iconToShow}
                </motion.div>
              )}
              
              {/* Content */}
              <motion.div 
                className="flex-1 min-w-0"
                variants={animated ? contentVariants : undefined}
              >
                {/* Title */}
                {title && (
                  <h4 className="font-semibold font-heading mb-1">
                    {title}
                  </h4>
                )}
                
                {/* Description */}
                {description && (
                  <p className="text-sm opacity-90 leading-relaxed">
                    {description}
                  </p>
                )}
                
                {/* Custom children */}
                {children && (
                  <div className="mt-2">
                    {children}
                  </div>
                )}
              </motion.div>
              
              {/* Close button */}
              {closable && (
                <motion.button
                  type="button"
                  onClick={handleClose}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg 
                    className="h-4 w-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Alert.displayName = "Alert";

export { Alert, alertVariants, sizeVariants, defaultIcons };