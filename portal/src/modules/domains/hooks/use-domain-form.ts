// src/modules/domains/hooks/use-domain-form.ts

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const domainSchema = z.object({
  domain_: z.string()
    .min(1, 'Domain name is required')
    .min(3, 'Domain name must be at least 3 characters')
    .max(255, 'Domain name is too long')
    .refine(
      (val) => /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(val),
      'Please enter a valid domain name (e.g., example.com)'
    ),
    
  client_id: z.number()
    .min(1, 'Client is required'),
    
  provider_id: z.number()
    .min(1, 'Provider is required'),
    
  purchase_date: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || !isNaN(Date.parse(val)),
      'Please enter a valid purchase date'
    ),
    
  expiration_date: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || !isNaN(Date.parse(val)),
      'Please enter a valid expiration date'
    ),
    
  renewal_price: z.number()
    .min(0, 'Renewal price must be greater than or equal to 0')
    .max(999999.99, 'Renewal price is too high'),
    
  status: z.enum(['active', 'expired', 'pending_transfer']),
  
  dns_provider: z.string()
    .max(255, 'DNS provider name is too long')
    .optional()
    .or(z.literal('')),
    
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => {
    if (data.purchase_date && data.expiration_date) {
      const purchaseDate = new Date(data.purchase_date);
      const expirationDate = new Date(data.expiration_date);
      return purchaseDate <= expirationDate;
    }
    return true;
  },
  {
    message: 'Expiration date must be after purchase date',
    path: ['expiration_date']
  }
);

export type DomainFormData = z.infer<typeof domainSchema>;

const defaultValues: DomainFormData = {
  domain_: '',
  client_id: 0,
  provider_id: 0,
  purchase_date: '',
  expiration_date: '',
  renewal_price: 0,
  status: 'active',
  dns_provider: '',
  notes: ''
};

interface UseDomainFormOptions {
  initialData?: Partial<DomainFormData>;
  onSubmit: (data: DomainFormData) => Promise<void>;
}

export const useDomainForm = ({ initialData, onSubmit }: UseDomainFormOptions) => {
  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData
    },
    mode: 'onBlur'
  });

  const handleSubmit = async (data: DomainFormData) => {
    try {
      form.clearErrors();
      
      // Format dates for API
      const formattedData = {
        ...data,
        purchase_date: data.purchase_date 
          ? new Date(data.purchase_date).toISOString().split('T')[0]
          : undefined,
        expiration_date: data.expiration_date 
          ? new Date(data.expiration_date).toISOString().split('T')[0]
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

  // Helper to calculate expiration date based on purchase date and term
  const calculateExpirationDate = (purchaseDate: string, years: number): string => {
    if (!purchaseDate) return '';
    
    const date = new Date(purchaseDate);
    date.setFullYear(date.getFullYear() + years);
    
    return date.toISOString().split('T')[0];
  };

  // Helper to check if domain is expiring soon
  const isExpiringSoon = (expirationDate?: string, days = 30): boolean => {
    if (!expirationDate) return false;
    
    const expiration = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration <= days && daysUntilExpiration >= 0;
  };

  // Helper to get days until expiration
  const getDaysUntilExpiration = (expirationDate?: string): number | null => {
    if (!expirationDate) return null;
    
    const expiration = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration;
  };

  // Auto-calculate expiration date when purchase date changes
  const watchPurchaseDate = form.watch('purchase_date');
  
  React.useEffect(() => {
    if (watchPurchaseDate && !form.getValues('expiration_date')) {
      // Default to 1 year expiration
      const expirationDate = calculateExpirationDate(watchPurchaseDate, 1);
      form.setValue('expiration_date', expirationDate);
    }
  }, [watchPurchaseDate, form]);

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
    reset: (data?: Partial<DomainFormData>) => form.reset({ ...defaultValues, ...data }),
    calculateExpirationDate,
    isExpiringSoon,
    getDaysUntilExpiration
  };
};