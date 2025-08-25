// src/components/ui/Badge.tsx

import React from 'react';
import { cn } from '../lib/utils';

// Crear una versión simple de cva
const createBadgeVariants = (base: string, variants: any, defaultVariants: any) => {
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

const badgeVariants = createBadgeVariants(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2",
  {
    variant: {
      default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
      secondary: "border-transparent bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
      destructive: "border-transparent bg-red-500 text-zinc-50 hover:bg-red-600",
      outline: "text-zinc-400 border-zinc-700 hover:bg-zinc-800",
      success: "border-transparent bg-green-600 text-zinc-50 hover:bg-green-700",
      warning: "border-transparent bg-yellow-600 text-zinc-50 hover:bg-yellow-700",
      info: "border-transparent bg-blue-600 text-zinc-50 hover:bg-blue-700",
      // Status específicos para tu app
      active: "border-transparent bg-green-600 text-zinc-50",
      inactive: "border-transparent bg-gray-500 text-zinc-50",
      prospect: "border-transparent bg-blue-600 text-zinc-50",
      draft: "border-transparent bg-gray-600 text-zinc-50",
      sent: "border-transparent bg-blue-600 text-zinc-50",
      paid: "border-transparent bg-green-600 text-zinc-50",
      overdue: "border-transparent bg-red-500 text-zinc-50",
      expired: "border-transparent bg-red-500 text-zinc-50",
      pending: "border-transparent bg-yellow-600 text-zinc-900",
      cancelled: "border-transparent bg-gray-500 text-zinc-50",
    },
    size: {
      default: "px-2.5 py-0.5 text-xs",
      sm: "px-2 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm",
    }
  },
  {
    variant: 'default',
    size: 'default'
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'default' | 'secondary' | 'destructive' | 'outline' 
    | 'success' | 'warning' | 'info'
    | 'active' | 'inactive' | 'prospect' 
    | 'draft' | 'sent' | 'paid' | 'overdue' 
    | 'expired' | 'pending' | 'cancelled';
  size?: 'default' | 'sm' | 'lg';
}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

// Helper para obtener el variant correcto según el status
export const getStatusBadgeVariant = (status: string): BadgeProps['variant'] => {
  const statusMap: Record<string, BadgeProps['variant']> = {
    'active': 'active',
    'inactive': 'inactive',
    'prospect': 'prospect',
    'draft': 'draft',
    'sent': 'sent',
    'paid': 'paid',
    'overdue': 'overdue',
    'expired': 'expired',
    'pending': 'pending',
    'cancelled': 'cancelled',
    'pending_transfer': 'pending',
    'trialing': 'info',
    'discontinued': 'inactive'
  };
  
  return statusMap[status] || 'default';
};

export { Badge };