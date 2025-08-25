// src/modules/services/hooks/use-service-form.ts

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const serviceSchema = z.object({
  service_name: z.string()
    .min(1, 'Service name is required')
    .min(2, 'Service name must be at least 2 characters')
    .max(255, 'Service name is too long'),
    
  description: z.string()
    .max(1000, 'Description is too long')
    .optional()
    .or(z.literal('')),
    
  category: z.enum(['hosting', 'maintenance', 'plugins', 'licenses', 'development']),
  
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  
  price: z.number()
    .min(0, 'Price must be greater than or equal to 0')
    .max(999999.99, 'Price is too high'),
    
  cost: z.number()
    .min(0, 'Cost must be greater than or equal to 0')
    .max(999999.99, 'Cost is too high')
    .optional(),
    
  profit_margin: z.number()
    .min(0, 'Profit margin must be greater than or equal to 0')
    .max(999999.99, 'Profit margin is too high')
    .optional(),
    
  billing_type: z.enum(['direct_billing', 'reseller']).optional(),
  
  billing_cycle: z.enum(['monthly', 'yearly', 'one_time']).optional(),
  
  client_id: z.number().optional(),
  
  start_date: z.string()
    .min(1, 'Start date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Please enter a valid start date'
    ),
    
  end_date: z.string()
    .min(1, 'End date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Please enter a valid end date'
    ),
    
  next_billing_date: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || !isNaN(Date.parse(val)),
      'Please enter a valid billing date'
    )
}).refine(
  (data) => {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return startDate <= endDate;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date']
  }
);

export type ServiceFormData = z.infer<typeof serviceSchema>;

const defaultValues: ServiceFormData = {
  service_name: '',
  description: '',
  category: 'development',
  status: 'active',
  price: 0,
  cost: 0,
  profit_margin: 0,
  billing_type: 'reseller',
  billing_cycle: 'monthly',
  client_id: undefined,
  start_date: '',
  end_date: '',
  next_billing_date: ''
};

interface UseServiceFormOptions {
  initialData?: Partial<ServiceFormData>;
  onSubmit: (data: ServiceFormData) => Promise<void>;
}

export const useServiceForm = ({ initialData, onSubmit }: UseServiceFormOptions) => {
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData
    },
    mode: 'onBlur'
  });

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      form.clearErrors();
      
      // Format dates for API
      const formattedData = {
        ...data,
        start_date: new Date(data.start_date).toISOString().split('T')[0],
        end_date: new Date(data.end_date).toISOString().split('T')[0],
        next_billing_date: data.next_billing_date 
          ? new Date(data.next_billing_date).toISOString()
          : undefined
      };
      
      await onSubmit(formattedData);
      
      // Only reset if this is a create form (no initial data)
      if (!initialData) {
        form.reset();
      }
    } catch (error: any) {
      form.setError('root', {
        type: 'manual',
        message: error.message || 'An error occurred while saving'
      });
    }
  };

  // Calculate profit margin automatically
  const calculateProfitMargin = (price: number, cost?: number): number => {
    if (!cost || cost === 0) return price;
    return Math.max(0, price - cost);
  };

  // Auto-update profit margin when price or cost changes
  const watchPrice = form.watch('price');
  const watchCost = form.watch('cost');
  
  React.useEffect(() => {
    const profitMargin = calculateProfitMargin(watchPrice || 0, watchCost || 0);
    form.setValue('profit_margin', profitMargin);
  }, [watchPrice, watchCost, form]);

  // Calculate next billing date based on start date and billing cycle
  const calculateNextBillingDate = (startDate: string, billingCycle?: string): string => {
    if (!startDate || !billingCycle) return '';
    
    const date = new Date(startDate);
    
    switch (billingCycle) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'one_time':
        // For one-time services, next billing date is the end date
        return '';
      default:
        return '';
    }
    
    return date.toISOString();
  };

  return {
    // Form methods
    ...form,
    handleSubmit: form.handleSubmit(handleSubmit),
    
    // State
    isLoading: form.formState.isSubmitting,
    error: form.formState.errors.root?.message,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    
    // Utilities
    clearError: () => form.clearErrors('root'),
    reset: (data?: Partial<ServiceFormData>) => form.reset({ ...defaultValues, ...data }),
    calculateProfitMargin,
    calculateNextBillingDate
  };
};