"use client";

import React, { forwardRef } from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del checkbox
const checkboxVariants = {
  default: [
    "border-slate-300 bg-white text-blue-600",
    "focus:ring-blue-500/20 focus:border-blue-500",
    "checked:bg-blue-600 checked:border-blue-600"
  ].join(" "),
  
  accent: [
    "border-slate-300 bg-white text-indigo-600",
    "focus:ring-indigo-500/20 focus:border-indigo-500",
    "checked:bg-indigo-400 checked:border-indigo-400"
  ].join(" "),
  
  success: [
    "border-slate-300 bg-white text-green-600",
    "focus:ring-green-500/20 focus:border-green-500",
    "checked:bg-green-600 checked:border-green-600"
  ].join(" "),
  
  warning: [
    "border-slate-300 bg-white text-amber-600",
    "focus:ring-amber-500/20 focus:border-amber-500",
    "checked:bg-amber-600 checked:border-amber-600"
  ].join(" "),
  
  error: [
    "border-red-300 bg-white text-red-600",
    "focus:ring-red-500/20 focus:border-red-500",
    "checked:bg-red-600 checked:border-red-600"
  ].join(" ")
};

const sizeVariants = {
  sm: "h-4 w-4",
  md: "h-5 w-5", 
  lg: "h-6 w-6"
};

// Animaciones
const checkboxMotionVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30
    }
  },
  focus: {
    scale: 1.05,
    boxShadow: "0 0 0 3px var(--tw-ring-color)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  disabled: {
    scale: 1,
    opacity: 0.6
  }
};

const checkmarkVariants: Variants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      delay: 0.1
    }
  }
};

const labelVariants: Variants = {
  initial: { x: 0 },
  hover: { x: 2 },
  disabled: { opacity: 0.6 }
};

export interface CheckboxProps extends Omit<HTMLMotionProps<"input">, "size" | "type"> {
  variant?: keyof typeof checkboxVariants;
  size?: keyof typeof sizeVariants;
  label?: string;
  description?: string;
  error?: boolean;
  indeterminate?: boolean;
  fullWidth?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    variant = "default",
    size = "md",
    label,
    description,
    error = false,
    indeterminate = false,
    disabled,
    checked,
    fullWidth = false,
    id,
    ...props
  }, ref) => {
    
    // Generar ID único si no se proporciona
    const checkboxId = id || React.useId();
    
    // Determinar variante basada en estado
    const getVariant = () => {
      if (error) return "error";
      return variant;
    };

    const baseClasses = [
      // Base styles
      "relative cursor-pointer rounded border-2",
      "transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2",
      "disabled:cursor-not-allowed disabled:opacity-60",
      
      // Variants
      checkboxVariants[getVariant()],
      sizeVariants[size]
    ].filter(Boolean).join(" ");

    const containerClasses = [
      "relative flex items-start space-x-3",
      fullWidth && "w-full",
      !disabled && "cursor-pointer"
    ].filter(Boolean).join(" ");

    const labelClasses = [
      "text-sm font-medium text-slate-700 font-body select-none",
      !disabled && "cursor-pointer"
    ].join(" ");

    const descriptionClasses = [
      "text-xs text-slate-500 font-body select-none",
      !disabled && "cursor-pointer"
    ].join(" ");

    return (
      <motion.div 
        className={containerClasses}
        initial="initial"
        whileHover={!disabled ? "hover" : "disabled"}
        animate={disabled ? "disabled" : "initial"}
      >
        {/* Checkbox Container */}
        <div className="relative flex items-center">
          <motion.input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="sr-only"
            disabled={disabled}
            checked={checked}
            {...props}
          />
          
          {/* Custom Checkbox */}
          <motion.label
            htmlFor={checkboxId}
            className={cn(baseClasses, className)}
            variants={checkboxMotionVariants}
            whileHover={!disabled ? "hover" : undefined}
            whileTap={!disabled ? "tap" : undefined}
            whileFocus={!disabled ? "focus" : undefined}
          >
            {/* Checkmark SVG */}
            <motion.svg
              className="absolute inset-0 h-full w-full text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              {indeterminate ? (
                // Indeterminate line
                <motion.path
                  d="M6 12h12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={checkmarkVariants}
                  animate={checked ? "checked" : "unchecked"}
                />
              ) : (
                // Checkmark
                <motion.path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={checkmarkVariants}
                  animate={checked ? "checked" : "unchecked"}
                />
              )}
            </motion.svg>
            
            {/* Focus ring */}
            <motion.div
              className="absolute inset-0 rounded border-2 border-transparent"
              animate={disabled ? "disabled" : "initial"}
            />
          </motion.label>
        </div>
        
        {/* Label and Description */}
        {(label || description) && (
          <motion.div 
            className="flex-1 min-w-0"
            variants={labelVariants}
            animate={disabled ? "disabled" : "initial"}
          >
            {label && (
              <motion.label
                htmlFor={checkboxId}
                className={labelClasses}
                whileHover={!disabled ? "hover" : undefined}
              >
                {label}
              </motion.label>
            )}
            
            {description && (
              <motion.p 
                className={descriptionClasses}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: disabled ? 0.4 : 0.8 }}
              >
                {description}
              </motion.p>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants, sizeVariants };