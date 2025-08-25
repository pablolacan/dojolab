// src/components/ui/Select.tsx

import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  error,
  className,
  size = 'default'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<SelectOption | null>(
    options.find(option => option.value === value) || null
  );
  
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update selected option when value changes externally
  React.useEffect(() => {
    const option = options.find(option => option.value === value);
    setSelectedOption(option || null);
  }, [value, options]);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    setSelectedOption(option);
    onValueChange?.(option.value);
    setIsOpen(false);
  };

  const sizeClasses = {
    default: 'h-10 px-3 py-2 text-sm',
    sm: 'h-9 px-2 py-1 text-sm',
    lg: 'h-11 px-4 py-2 text-base'
  };

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "relative w-full rounded-md border bg-zinc-900 text-left transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error 
            ? "border-red-500 focus:border-red-400" 
            : "border-zinc-700 hover:border-zinc-600 focus:border-lime-300",
          sizeClasses[size],
          className
        )}
      >
        <span className={cn(
          "block truncate text-white",
          !selectedOption && "text-zinc-400"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform",
              isOpen && "transform rotate-180"
            )}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={option.disabled}
              className={cn(
                "relative w-full px-3 py-2 text-left text-sm transition-colors",
                "hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selectedOption?.value === option.value && "bg-zinc-800 text-lime-300"
              )}
            >
              <span className="block truncate">
                {option.label}
              </span>
              {selectedOption?.value === option.value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Check className="h-4 w-4 text-lime-300" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple native select for forms
interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: string;
  label?: string;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, options, error, label, ...props }, ref) => {
    const selectId = React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={selectId}
            className={cn(
              "block text-sm font-medium transition-colors",
              error ? "text-red-400" : "text-white",
              props.disabled && "text-zinc-500"
            )}
          >
            {label}
          </label>
        )}
        
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border px-3 py-2 text-sm",
            "bg-zinc-900 text-white ring-offset-zinc-950",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            error 
              ? "border-red-500 focus-visible:ring-red-400" 
              : "border-zinc-700 hover:border-zinc-600 focus-visible:ring-lime-300",
            className
          )}
          {...props}
        >
          {options.map((option, index) => (
            <option 
              key={index} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';