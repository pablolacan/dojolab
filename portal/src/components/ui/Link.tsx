"use client";

import React, { forwardRef } from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del link
const linkVariants = {
  default: [
    "text-blue-600 hover:text-blue-700",
    "underline-offset-4 hover:underline",
    "focus:text-blue-700 focus:underline"
  ].join(" "),
  
  accent: [
    "text-indigo-600 hover:text-indigo-700",
    "underline-offset-4 hover:underline",
    "focus:text-indigo-700 focus:underline"
  ].join(" "),
  
  muted: [
    "text-slate-500 hover:text-slate-700",
    "underline-offset-4 hover:underline",
    "focus:text-slate-700 focus:underline"
  ].join(" "),
  
  subtle: [
    "text-slate-600 hover:text-blue-600",
    "no-underline hover:underline underline-offset-4",
    "focus:text-blue-600 focus:underline"
  ].join(" "),
  
  destructive: [
    "text-red-600 hover:text-red-700",
    "underline-offset-4 hover:underline",
    "focus:text-red-700 focus:underline"
  ].join(" "),
  
  ghost: [
    "text-slate-400 hover:text-slate-600",
    "no-underline hover:no-underline",
    "focus:text-slate-600"
  ].join(" "),
  
  contrast: [
    "text-white hover:text-slate-200",
    "underline-offset-4 hover:underline",
    "focus:text-slate-200 focus:underline"
  ].join(" ")
};

const sizeVariants = {
  xs: "text-xs",
  sm: "text-sm", 
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl"
};

const weightVariants = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold"
};

// Animaciones
const linkMotionVariants: Variants = {
  initial: {
    scale: 1,
    x: 0
  },
  hover: {
    scale: 1.02,
    x: 2,
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
  focus: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
    x: 0
  }
};

const iconVariants: Variants = {
  initial: { x: 0, rotate: 0 },
  hover: { x: 2, rotate: 0 },
  external: { rotate: 45 }
};

const underlineVariants: Variants = {
  initial: { 
    scaleX: 0,
    originX: 0 
  },
  hover: { 
    scaleX: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
};

export interface LinkProps extends Omit<HTMLMotionProps<"a">, "size"> {
  variant?: keyof typeof linkVariants;
  size?: keyof typeof sizeVariants;
  weight?: keyof typeof weightVariants;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  external?: boolean;
  showUnderline?: boolean;
  animated?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({
    className,
    variant = "default",
    size = "sm",
    weight = "medium",
    leftIcon,
    rightIcon,
    external = false,
    showUnderline = false,
    animated = true,
    disabled = false,
    children,
    href,
    target,
    rel,
    ...props
  }, ref) => {
    
    const baseClasses = [
      // Base styles
      "relative inline-flex items-center gap-1",
      "font-body transition-all duration-200 ease-in-out",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 rounded-sm",
      "cursor-pointer select-none",
      
      // Disabled state
      disabled && "cursor-not-allowed pointer-events-none",
      
      // Variants
      linkVariants[variant],
      sizeVariants[size],
      weightVariants[weight]
    ].filter(Boolean).join(" ");

    // Determinar props de target y rel para enlaces externos
    const linkTarget = external ? "_blank" : target;
    const linkRel = external ? "noopener noreferrer" : rel;

    return (
      <motion.a
        ref={ref}
        href={disabled ? undefined : href}
        target={linkTarget}
        rel={linkRel}
        className={cn(baseClasses, className)}
        variants={animated ? linkMotionVariants : undefined}
        initial={animated ? "initial" : undefined}
        whileHover={animated && !disabled ? "hover" : undefined}
        whileTap={animated && !disabled ? "tap" : undefined}
        whileFocus={animated && !disabled ? "focus" : undefined}
        animate={disabled ? "disabled" : "initial"}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && (
          <motion.span 
            className="flex items-center"
            variants={animated ? iconVariants : undefined}
            animate={animated ? "initial" : undefined}
          >
            {leftIcon}
          </motion.span>
        )}
        
        {/* Content with custom underline */}
        <span className="relative">
          {children}
          
          {/* Custom animated underline */}
          {showUnderline && animated && (
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 w-full bg-current"
              variants={underlineVariants}
              initial="initial"
              whileHover="hover"
            />
          )}
        </span>
        
        {/* Right Icon */}
        {rightIcon && (
          <motion.span 
            className="flex items-center"
            variants={animated ? iconVariants : undefined}
            animate={animated ? "initial" : undefined}
          >
            {rightIcon}
          </motion.span>
        )}
        
        {/* External Icon */}
        {external && !rightIcon && (
          <motion.span 
            className="flex items-center text-current opacity-60"
            variants={animated ? iconVariants : undefined}
            animate={animated ? "external" : undefined}
          >
            <svg 
              className="h-3 w-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
          </motion.span>
        )}
      </motion.a>
    );
  }
);

Link.displayName = "Link";

export { Link, linkVariants, sizeVariants, weightVariants };