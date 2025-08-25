// src/modules/subscriptions/hooks/use-subscription-form.ts

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const subscriptionSchema = z.object({
  service_name: z.string()
    .min(1, 'Service name is required')
    .min(2, 'Service name must be at least 2 characters')
    .max(255, 'Service name is too long'),
    
  plan_type: z.enum(['free', 'paid']),
  
  billing_cycle: z.enum(['monthly', 'yearly', 'one_time', 'none']),
  
  renewal_date: z.string()
    .min(1, 'Renewal date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Please enter a valid date'
    ),
    
  cost: z.number()
    .min(0, 'Cost must be greater than or equal to 0')
    .max(999999.99, 'Cost is too high'),
    
  status: z.enum(['pending', 'active', 'cancelled', 'expired', 'trialing']).optional()
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const defaultValues: SubscriptionFormData = {
  service_name: '',
  plan_type: 'paid',
  billing_cycle: 'monthly',
  renewal_date: '',
  cost: 0,
  status: 'pending'
};

interface UseSubscriptionFormOptions {
  initialData?: Partial<SubscriptionFormData>;
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
}

export const useSubscriptionForm = ({ initialData, onSubmit }: UseSubscriptionFormOptions) => {
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData
    },
    mode: 'onBlur'
  });

  const handleSubmit = async (data: SubscriptionFormData) => {
    try {
      form.clearErrors();
      
      // Convert string date to proper format for API
      const formattedData = {
        ...data,
        renewal_date: new Date(data.renewal_date).toISOString().split('T')[0] // YYYY-MM-DD format
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

  // Helper to calculate next renewal date based on billing cycle
  const calculateNextRenewalDate = (startDate: string, billingCycle: string): string => {
    const date = new Date(startDate);
    
    switch (billingCycle) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'one_time':
      case 'none':
        // No renewal for one-time or free services
        break;
      default:
        break;
    }
    
    return date.toISOString().split('T')[0];
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
    reset: (data?: Partial<SubscriptionFormData>) => form.reset({ ...defaultValues, ...data }),
    calculateNextRenewalDate
  };
};