import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  className?: string;
}

export const StatusBadge = ({ 
  status, 
  variant = 'neutral', 
  size = 'md',
  icon,
  className = '' 
}: StatusBadgeProps) => {
  const getVariantStyles = (variant: string) => {
    const styles = {
      success: "text-green-700 bg-green-100 border-green-200",
      warning: "text-yellow-700 bg-yellow-100 border-yellow-200", 
      error: "text-red-700 bg-red-100 border-red-200",
      info: "text-blue-700 bg-blue-100 border-blue-200",
      neutral: "text-gray-700 bg-gray-100 border-gray-200"
    };
    return styles[variant as keyof typeof styles] || styles.neutral;
  };

  const getSizeStyles = (size: string) => {
    const styles = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1 text-xs", 
      lg: "px-4 py-2 text-sm"
    };
    return styles[size as keyof typeof styles] || styles.md;
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${getVariantStyles(variant)} ${getSizeStyles(size)} ${className}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {status}
    </span>
  );
};