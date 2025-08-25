import React from 'react';
import { cn } from '../lib/utils';

// Crear una versión simple de cva
const createVariants = (base: string, variants: any, defaultVariants: any) => {
  return (props: any = {}) => {
    let classes = base;
    
    Object.keys(variants).forEach(key => {
      const value = props[key] || defaultVariants[key];
      if (value && variants[key][value]) {
        classes += ' ' + variants[key][value];
      }
    });
    
    return classes;
  };
};

const buttonVariants = createVariants(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variant: {
      default: 'bg-zinc-900 text-white hover:bg-zinc-800',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      outline: 'border border-zinc-700 bg-transparent text-white hover:bg-zinc-800',
      secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',
      ghost: 'hover:bg-zinc-800 text-white',
      link: 'text-white underline-offset-4 hover:underline',
      primary: 'bg-lime-300 text-zinc-900 hover:bg-lime-400 focus-visible:ring-lime-400 font-semibold',
      success: 'bg-green-600 text-white hover:bg-green-700',
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    },
  },
  {
    variant: 'default',
    size: 'default',
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };