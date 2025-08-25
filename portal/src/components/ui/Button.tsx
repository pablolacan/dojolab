"use client";

import React, { forwardRef } from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del botón
const buttonVariants = {
  primary: [
    "bg-blue-500 hover:bg-blue-600 text-white",
    "shadow-md hover:shadow-lg",
    "border border-transparent"
  ].join(" "),
  
  secondary: [
    "bg-slate-100 hover:bg-slate-200 text-slate-600",
    "shadow-sm hover:shadow-md",
    "border border-slate-200 hover:border-slate-300"
  ].join(" "),
  
  accent: [
    "bg-indigo-300 hover:bg-indigo-400 text-indigo-900",
    "shadow-md hover:shadow-lg",
    "border border-transparent"
  ].join(" "),
  
  outline: [
    "bg-transparent hover:bg-slate-50 text-slate-700",
    "border border-slate-200 hover:border-slate-300",
    "shadow-sm hover:shadow-md"
  ].join(" "),
  
  ghost: [
    "bg-transparent hover:bg-slate-100 text-slate-600",
    "border border-transparent hover:border-slate-200"
  ].join(" "),
  
  destructive: [
    "bg-red-500 hover:bg-red-600 text-white",
    "shadow-md hover:shadow-lg",
    "border border-transparent"
  ].join(" "),
  
  success: [
    "bg-green-500 hover:bg-green-600 text-white",
    "shadow-md hover:shadow-lg",
    "border border-transparent"
  ].join(" "),
  
  warning: [
    "bg-amber-500 hover:bg-amber-600 text-white",
    "shadow-md hover:shadow-lg",
    "border border-transparent"
  ].join(" ")
};

const sizeVariants = {
  xs: "h-7 px-2 text-xs font-medium",
  sm: "h-8 px-3 text-sm font-medium",
  md: "h-10 px-4 text-sm font-medium",
  lg: "h-11 px-6 text-base font-medium",
  xl: "h-12 px-8 text-base font-semibold",
  icon: "h-10 w-10 p-0"
};

// Animaciones
const buttonMotionVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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
  disabled: {
    scale: 1,
    opacity: 0.6,
    boxShadow: "none"
  }
};

const loadingVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "animate" | "initial" | "whileHover" | "whileTap"> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof sizeVariants;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = false,
    glow = false,
    disabled,
    children,
    type = "button",
    ...props
  }, ref) => {
    
    const baseClasses = [
      // Base styles
      "relative inline-flex items-center justify-center",
      "font-body font-medium",
      "transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      "active:translate-y-0.5",
      "select-none cursor-pointer",
      
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-60",
      "disabled:hover:scale-100 disabled:active:translate-y-0",
      
      // Conditional classes
      fullWidth && "w-full",
      rounded ? "rounded-full" : "rounded-lg",
      glow && "animate-pulse-glow",
      
      // Variants
      buttonVariants[variant],
      sizeVariants[size]
    ].filter(Boolean).join(" ");

    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, className)}
        disabled={isDisabled}
        type={type}
        variants={buttonMotionVariants}
        initial="initial"
        whileHover={!isDisabled ? "hover" : "disabled"}
        whileTap={!isDisabled ? "tap" : "disabled"}
        animate={isDisabled ? "disabled" : "initial"}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.div
            className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            variants={loadingVariants}
            animate="animate"
          />
        )}
        
        {/* Left icon */}
        {leftIcon && !loading && (
          <motion.span className={cn("flex items-center", children && "mr-2")}>
            {leftIcon}
          </motion.span>
        )}
        
        {/* Content */}
        {children && (
          <motion.span className="flex items-center">
            {children}
          </motion.span>
        )}
        
        {/* Right icon */}
        {rightIcon && !loading && (
          <motion.span className={cn("flex items-center", children && "ml-2")}>
            {rightIcon}
          </motion.span>
        )}
        
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-inherit overflow-hidden pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 0.15 }}
          style={{
            background: "radial-gradient(circle, currentColor 10%, transparent 10.01%)",
          }}
        />
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants, sizeVariants };