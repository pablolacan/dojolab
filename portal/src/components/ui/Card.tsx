"use client";

import React, { forwardRef } from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del card
const cardVariants = {
  default: [
    "bg-white border-slate-200 shadow-md",
    "hover:shadow-lg"
  ].join(" "),
  
  elevated: [
    "bg-white border-slate-200 shadow-lg",
    "hover:shadow-xl"
  ].join(" "),
  
  outlined: [
    "bg-white border-slate-300 shadow-sm",
    "hover:shadow-md hover:border-slate-400"
  ].join(" "),
  
  ghost: [
    "bg-white/80 border-slate-200/50 shadow-sm backdrop-blur-sm",
    "hover:bg-white/90 hover:shadow-md"
  ].join(" "),
  
  gradient: [
    "bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-md",
    "hover:shadow-lg"
  ].join(" "),
  
  glass: [
    "bg-white/70 border-white/20 shadow-lg backdrop-blur-md",
    "hover:bg-white/80 hover:shadow-xl"
  ].join(" ")
};

const sizeVariants = {
  sm: "p-4",
  md: "p-6", 
  lg: "p-8",
  xl: "p-10"
};

// Animaciones
const cardMotionVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.4
    }
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const headerVariants: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.1, duration: 0.3 }
  }
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.2, duration: 0.3 }
  }
};

const footerVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.3, duration: 0.3 }
  }
};

export interface CardProps extends Omit<HTMLMotionProps<"div">, "size"> {
  variant?: keyof typeof cardVariants;
  size?: keyof typeof sizeVariants;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  description?: string;
  hoverable?: boolean;
  clickable?: boolean;
  animated?: boolean;
  fullWidth?: boolean;
  centered?: boolean;
  children?: React.ReactNode;
  onCardClick?: () => void;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant = "default",
    size = "md",
    header,
    footer,
    title,
    description,
    hoverable = false,
    clickable = false,
    animated = true,
    fullWidth = false,
    centered = false,
    children,
    onCardClick,
    ...props
  }, ref) => {

    const baseClasses = [
      // Base styles
      "relative rounded-lg border transition-all duration-200 ease-in-out",
      "font-body",
      
      // Interactive states
      clickable && "cursor-pointer select-none",
      
      // Layout
      fullWidth && "w-full",
      centered && "mx-auto",
      
      // Variants
      cardVariants[variant],
      sizeVariants[size]
    ].filter(Boolean).join(" ");

    const shouldHover = hoverable || clickable;

    return (
      <motion.div
        ref={ref}
        className={cn(baseClasses, className)}
        variants={animated ? cardMotionVariants : undefined}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        whileHover={animated && shouldHover ? "hover" : undefined}
        whileTap={animated && clickable ? "tap" : undefined}
        exit={animated ? "exit" : undefined}
        onClick={clickable ? onCardClick : undefined}
        {...props}
      >
        {/* Header Section */}
        {(header || title || description) && (
          <motion.div
            className="mb-4 space-y-2"
            variants={animated ? headerVariants : undefined}
          >
            {/* Custom Header */}
            {header && (
              <div className="flex items-center justify-between">
                {header}
              </div>
            )}
            
            {/* Title */}
            {title && (
              <motion.h3 className="text-lg font-semibold font-heading text-slate-900">
                {title}
              </motion.h3>
            )}
            
            {/* Description */}
            {description && (
              <motion.p className="text-sm text-slate-600 leading-relaxed">
                {description}
              </motion.p>
            )}
            
            {/* Divider if there's content below */}
            {(children || footer) && (
              <div className="border-b border-slate-100 -mx-6 mt-4"></div>
            )}
          </motion.div>
        )}
        
        {/* Main Content */}
        {children && (
          <motion.div
            className="space-y-4"
            variants={animated ? contentVariants : undefined}
          >
            {children}
          </motion.div>
        )}
        
        {/* Footer Section */}
        {footer && (
          <motion.div
            className="mt-6 pt-4 border-t border-slate-100"
            variants={animated ? footerVariants : undefined}
          >
            {footer}
          </motion.div>
        )}
        
        {/* Hover Effect Overlay */}
        {animated && shouldHover && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: 0.05,
              background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent)"
            }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

// Subcomponentes para facilitar el uso
export const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-between", className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-semibold font-heading text-slate-900", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-slate-600 leading-relaxed", className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-4", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-between pt-4 border-t border-slate-100", className)} {...props}>
    {children}
  </div>
);

export { Card, cardVariants, sizeVariants };