import React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    error, 
    label, 
    helperText, 
    leftIcon, 
    rightIcon, 
    onRightIconClick,
    disabled,
    ...props 
  }, ref) => {
    const inputId = React.useId();
    const hasError = !!error;

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium transition-colors",
              hasError ? "text-red-400" : "text-white",
              disabled && "text-zinc-500"
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border px-3 py-2 text-sm",
              "bg-zinc-900 text-white ring-offset-zinc-950 file:border-0 file:bg-transparent",
              "file:text-sm file:font-medium placeholder:text-zinc-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-200",
              // Estados normales
              !hasError && [
                "border-zinc-700 focus-visible:ring-lime-300",
                "hover:border-zinc-600 focus:border-lime-300"
              ],
              // Estados de error
              hasError && [
                "border-red-500 focus-visible:ring-red-400",
                "focus:border-red-400"
              ],
              // Padding para iconos
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div 
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400",
                onRightIconClick && "cursor-pointer hover:text-white"
              )}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <p className={cn(
            "text-xs",
            hasError ? "text-red-400" : "text-zinc-400"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };