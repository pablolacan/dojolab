"use client";

import { forwardRef } from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

// Variants del divider
const dividerVariants = {
  default: "border-slate-200",
  muted: "border-slate-100",
  subtle: "border-slate-50",
  accent: "border-blue-200",
  strong: "border-slate-300"
};

const orientationVariants = {
  horizontal: "w-full border-t",
  vertical: "h-full border-l"
};

const sizeVariants = {
  xs: "border-[0.5px]",
  sm: "border-[1px]",
  md: "border-[1.5px]",
  lg: "border-2"
};

// Animaciones
const dividerMotionVariants: Variants = {
  initial: {
    scaleX: 0,
    opacity: 0
  },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: {
    scaleX: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

const verticalDividerVariants: Variants = {
  initial: {
    scaleY: 0,
    opacity: 0
  },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

const labelVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
    y: 10
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: 0.3
    }
  }
};

const dotVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "backOut",
      delay: 0.2
    }
  }
};

export interface DividerProps extends Omit<HTMLMotionProps<"div">, "size"> {
  variant?: keyof typeof dividerVariants;
  orientation?: keyof typeof orientationVariants;
  size?: keyof typeof sizeVariants;
  label?: string;
  labelPosition?: "left" | "center" | "right";
  decorative?: boolean;
  dashed?: boolean;
  dotted?: boolean;
  gradient?: boolean;
  animated?: boolean;
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
}

const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({
    className,
    variant = "default",
    orientation = "horizontal",
    size = "sm",
    label,
    labelPosition = "center",
    decorative = false,
    dashed = false,
    dotted = false,
    gradient = false,
    animated = true,
    spacing = "md",
    ...props
  }, ref) => {
    
    const spacingClasses = {
      none: "",
      sm: orientation === "horizontal" ? "my-2" : "mx-2",
      md: orientation === "horizontal" ? "my-4" : "mx-4", 
      lg: orientation === "horizontal" ? "my-6" : "mx-6",
      xl: orientation === "horizontal" ? "my-8" : "mx-8"
    };

    const baseClasses = [
      // Base styles
      "relative flex items-center justify-center",
      
      // Spacing
      spacingClasses[spacing],
      
      // Orientation
      orientation === "vertical" && "flex-col h-full",
    ].filter(Boolean).join(" ");

    const lineClasses = [
      // Base line styles
      "border-0",
      
      // Variants
      dividerVariants[variant],
      orientationVariants[orientation],
      sizeVariants[size],
      
      // Styles
      dashed && "border-dashed",
      dotted && "border-dotted",
      gradient && orientation === "horizontal" && "bg-gradient-to-r from-transparent via-current to-transparent border-0 h-px",
      gradient && orientation === "vertical" && "bg-gradient-to-b from-transparent via-current to-transparent border-0 w-px"
    ].filter(Boolean).join(" ");

    const labelClasses = [
      "px-3 py-1 text-xs font-medium text-slate-500 bg-white font-body",
      "whitespace-nowrap select-none",
      orientation === "vertical" && "px-1 py-3"
    ].filter(Boolean).join(" ");

    // Render simple divider without label
    if (!label && !decorative) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, className)}
          variants={animated ? (orientation === "horizontal" ? dividerMotionVariants : verticalDividerVariants) : undefined}
          initial={animated ? "initial" : undefined}
          animate={animated ? "animate" : undefined}
          exit={animated ? "exit" : undefined}
          {...props}
        >
          <div className={lineClasses} />
        </motion.div>
      );
    }

    // Render divider with label
    if (label) {
      const isCenter = labelPosition === "center";
      const isLeft = labelPosition === "left";
      const isRight = labelPosition === "right";

      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, className)}
          initial={animated ? "initial" : undefined}
          animate={animated ? "animate" : undefined}
          exit={animated ? "exit" : undefined}
          {...props}
        >
          {/* Left/Top line */}
          {(isCenter || isRight) && (
            <motion.div
              className={cn(lineClasses, "flex-1")}
              variants={animated ? (orientation === "horizontal" ? dividerMotionVariants : verticalDividerVariants) : undefined}
            />
          )}
          
          {/* Label */}
          <motion.span
            className={labelClasses}
            variants={animated ? labelVariants : undefined}
          >
            {label}
          </motion.span>
          
          {/* Right/Bottom line */}
          {(isCenter || isLeft) && (
            <motion.div
              className={cn(lineClasses, "flex-1")}
              variants={animated ? (orientation === "horizontal" ? dividerMotionVariants : verticalDividerVariants) : undefined}
            />
          )}
        </motion.div>
      );
    }

    // Render decorative divider
    if (decorative) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, className)}
          initial={animated ? "initial" : undefined}
          animate={animated ? "animate" : undefined}
          exit={animated ? "exit" : undefined}
          {...props}
        >
          {/* Left line */}
          <motion.div
            className={cn(lineClasses, "flex-1")}
            variants={animated ? (orientation === "horizontal" ? dividerMotionVariants : verticalDividerVariants) : undefined}
          />
          
          {/* Decorative dots */}
          <div className="flex items-center space-x-1 px-3">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1 h-1 bg-slate-300 rounded-full"
                variants={animated ? dotVariants : undefined}
                style={{ animationDelay: animated ? `${index * 0.1}s` : undefined }}
              />
            ))}
          </div>
          
          {/* Right line */}
          <motion.div
            className={cn(lineClasses, "flex-1")}
            variants={animated ? (orientation === "horizontal" ? dividerMotionVariants : verticalDividerVariants) : undefined}
          />
        </motion.div>
      );
    }

    return null;
  }
);

Divider.displayName = "Divider";

export { Divider, dividerVariants, orientationVariants, sizeVariants };