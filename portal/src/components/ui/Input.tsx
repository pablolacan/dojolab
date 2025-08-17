// src/components/ui/Input.tsx

import React, { useState, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'filled';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  showPasswordToggle?: boolean;
  loading?: boolean;
  success?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  size = 'md',
  variant = 'default',
  icon,
  rightIcon,
  isPassword = false,
  showPasswordToggle = true,
  loading = false,
  success = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  type = 'text',
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determinar el tipo de input
  const inputType = isPassword 
    ? (showPassword ? 'text' : 'password')
    : type;

  // Event handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyUp?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Estilos base
  const getSizeStyles = (inputSize: string) => {
    const styles = {
      sm: {
        input: 'px-3 py-2 text-sm',
        icon: 'w-4 h-4',
        spacing: 'space-x-2'
      },
      md: {
        input: 'px-4 py-3 text-base',
        icon: 'w-5 h-5',
        spacing: 'space-x-3'
      },
      lg: {
        input: 'px-5 py-4 text-lg',
        icon: 'w-6 h-6',
        spacing: 'space-x-4'
      }
    };
    return styles[inputSize as keyof typeof styles] || styles.md;
  };

  const getVariantStyles = (inputVariant: string) => {
    const baseStyles = 'w-full border rounded-2xl transition-all duration-200 focus:outline-none';
    
    const variants = {
      default: `${baseStyles} bg-white border-gray-200 focus:border-[#c9f31d] focus:ring-[#c9f31d]/20 focus:ring-2`,
      minimal: `${baseStyles} bg-transparent border-0 border-b-2 border-gray-200 rounded-none focus:border-[#c9f31d] focus:ring-0`,
      filled: `${baseStyles} bg-gray-50 border-gray-100 focus:bg-white focus:border-[#c9f31d] focus:ring-[#c9f31d]/20 focus:ring-2`
    };
    
    return variants[inputVariant as keyof typeof variants] || variants.default;
  };

  const sizeStyles = getSizeStyles(size);
  const variantStyles = getVariantStyles(variant);

  // Estados de color
  const getStateStyles = () => {
    if (error) {
      return 'border-red-300 focus:border-red-500 focus:ring-red-200';
    }
    if (success) {
      return 'border-green-300 focus:border-green-500 focus:ring-green-200';
    }
    return '';
  };

  const inputClassName = `
    ${variantStyles}
    ${sizeStyles.input}
    ${getStateStyles()}
    ${icon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : ''}
    ${(rightIcon || (isPassword && showPasswordToggle) || loading) ? (size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10') : ''}
    ${props.disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={props.id}
          className={`block text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${sizeStyles.icon}`}>
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref || inputRef}
          type={inputType}
          className={inputClassName}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Right Icons Container */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Loading Spinner */}
          {loading && (
            <div className={`animate-spin text-gray-400 ${sizeStyles.icon}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </div>
          )}

          {/* Success Icon */}
          {success && !loading && (
            <div className={`text-green-500 ${sizeStyles.icon}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          )}

          {/* Password Toggle */}
          {isPassword && showPasswordToggle && !loading && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`text-gray-400 hover:text-gray-600 transition-colors ${sizeStyles.icon}`}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" 
                  />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                  />
                </svg>
              )}
            </button>
          )}

          {/* Custom Right Icon */}
          {rightIcon && !loading && !success && (
            <div className={`text-gray-400 ${sizeStyles.icon}`}>
              {rightIcon}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-2 text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';