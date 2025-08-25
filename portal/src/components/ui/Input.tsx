"use client";

import React, { forwardRef, useState } from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del input
const inputVariants = {
  default: [
    "bg-white border-slate-200 text-slate-900",
    "focus:border-blue-500 focus:ring-blue-500/20",
    "placeholder:text-slate-400"
  ].join(" "),
  
  filled: [
    "bg-slate-50 border-slate-200 text-slate-900",
    "focus:bg-white focus:border-blue-500 focus:ring-blue-500/20",
    "placeholder:text-slate-400"
  ].join(" "),
  
  outlined: [
    "bg-transparent border-slate-300 text-slate-900",
    "focus:border-blue-500 focus:ring-blue-500/20",
    "placeholder:text-slate-500"
  ].join(" "),
  
  ghost: [
    "bg-transparent border-transparent text-slate-900",
    "focus:bg-slate-50 focus:border-slate-200 focus:ring-slate-200/50",
    "hover:bg-slate-50",
    "placeholder:text-slate-400"
  ].join(" "),
  
  error: [
    "bg-white border-red-300 text-slate-900",
    "focus:border-red-500 focus:ring-red-500/20",
    "placeholder:text-red-300"
  ].join(" "),
  
  success: [
    "bg-white border-green-300 text-slate-900",
    "focus:border-green-500 focus:ring-green-500/20",
    "placeholder:text-green-300"
  ].join(" ")
};

const sizeVariants = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-4 text-base",
  xl: "h-12 px-5 text-base"
};

// Animaciones
const inputMotionVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  },
  focus: {
    scale: 1.01,
    boxShadow: "0 0 0 3px var(--tw-ring-color), 0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    boxShadow: "none"
  }
};

const iconMotionVariants: Variants = {
  initial: { scale: 1, opacity: 0.7 },
  hover: { scale: 1.1, opacity: 1 },
  focus: { scale: 1.1, opacity: 1 }
};

export interface InputProps extends Omit<HTMLMotionProps<"input">, "size"> {
  variant?: keyof typeof inputVariants;
  size?: keyof typeof sizeVariants;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
  rounded?: boolean;
  onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant = "default",
    size = "md",
    leftIcon,
    rightIcon,
    clearable = false,
    loading = false,
    error = false,
    success = false,
    helperText,
    label,
    fullWidth = false,
    rounded = false,
    disabled,
    value,
    onClear,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    
    const [isFocused, setIsFocused] = useState(false);
    
    // Determinar variante basada en estado
    const getVariant = () => {
      if (error) return "error";
      if (success) return "success";
      return variant;
    };

    const baseClasses = [
      // Base styles
      "relative flex items-center",
      "font-body transition-all duration-200 ease-in-out",
      "border rounded-lg",
      "focus-within:ring-2",
      "disabled:cursor-not-allowed disabled:opacity-60",
      
      // Conditional classes
      fullWidth && "w-full",
      rounded && "rounded-full",
      
      // Variants
      inputVariants[getVariant()],
      sizeVariants[size]
    ].filter(Boolean).join(" ");

    const inputClasses = [
      "flex-1 bg-transparent border-0 outline-none",
      "placeholder:transition-colors",
      "disabled:cursor-not-allowed"
    ].join(" ");

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleClear = () => {
      onClear?.();
    };

    const showClearButton = clearable && value && !disabled && !loading;

    return (
      <div className={cn("space-y-1", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <motion.label 
            className="block text-sm font-medium text-slate-700 font-heading"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: isFocused ? 1 : 0.8 }}
          >
            {label}
          </motion.label>
        )}
        
        {/* Input Container */}
        <motion.div
          className={cn(baseClasses, className)}
          variants={inputMotionVariants}
          initial="initial"
          animate={disabled ? "disabled" : isFocused ? "focus" : "initial"}
        >
          {/* Left Icon */}
          {leftIcon && (
            <motion.div 
              className="flex items-center justify-center ml-1 text-slate-400"
              variants={iconMotionVariants}
              animate={isFocused ? "focus" : "initial"}
            >
              {leftIcon}
            </motion.div>
          )}
          
          {/* Input */}
          <motion.input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {/* Loading Spinner */}
          {loading && (
            <motion.div
              className="flex items-center justify-center mr-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          )}
          
          {/* Clear Button */}
          {showClearButton && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="flex items-center justify-center mr-1 text-slate-400 hover:text-slate-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
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
          
          {/* Right Icon */}
          {rightIcon && !loading && !showClearButton && (
            <motion.div 
              className="flex items-center justify-center mr-1 text-slate-400"
              variants={iconMotionVariants}
              animate={isFocused ? "focus" : "initial"}
            >
              {rightIcon}
            </motion.div>
          )}
        </motion.div>
        
        {/* Helper Text */}
        {helperText && (
          <motion.p 
            className={cn(
              "text-xs font-body px-1",
              error && "text-red-500",
              success && "text-green-500",
              !error && !success && "text-slate-500"
            )}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants, sizeVariants };