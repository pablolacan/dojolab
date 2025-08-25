// src/modules/invoices/hooks/use-invoice-form.ts

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const invoiceSchema = z.object({
  client_id: z.number()
    .min(1, 'Client is required'),
    
  projects_id: z.number()
    .optional(),
    
  invoice_number: z.string()
    .min(1, 'Invoice number is required')
    .min(3, 'Invoice number must be at least 3 characters')
    .max(255, 'Invoice number is too long'),
    
  invoice_date: z.string()
    .min(1, 'Invoice date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Please enter a valid invoice date'
    ),
    
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount is too high'),
    
  invoice_file: z.string()
    .min(1, 'Invoice file is required'),
    
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional()
    .or(z.literal(''))
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

const defaultValues: InvoiceFormData = {
  client_id: 0,
  projects_id: undefined,
  invoice_number: '',
  invoice_date: '',
  amount: 0,
  invoice_file: '',
  status: 'draft',
  notes: ''
};

interface UseInvoiceFormOptions {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  autoGenerateNumber?: boolean;
}

export const useInvoiceForm = ({ initialData, onSubmit, autoGenerateNumber = false }: UseInvoiceFormOptions) => {
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData
    },
    mode: 'onBlur'
  });

  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      form.clearErrors();
      
      // Format date for API
      const formattedData = {
        ...data,
        invoice_date: new Date(data.invoice_date).toISOString(),
        projects_id: data.projects_id || undefined // Remove if empty
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

  // Auto-generate invoice number if enabled
  React.useEffect(() => {
    if (autoGenerateNumber && !form.getValues('invoice_number') && !initialData?.invoice_number) {
      // This would be called from the component that uses this hook
      // to avoid importing the API directly in the hook
    }
  }, [autoGenerateNumber, form, initialData?.invoice_number]);

  // Helper to calculate amount from line items (for future use)
  const calculateAmount = (lineItems: Array<{ quantity: number; price: number }>): number => {
    return lineItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  // Helper to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(amount);
  };

  // Helper to get status color
  const getStatusColor = (status: string): string => {
    const colors = {
      draft: 'gray',
      sent: 'blue',
      paid: 'green',
      overdue: 'red'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  // Helper to get status label
  const getStatusLabel = (status: string): string => {
    const labels = {
      draft: 'Borrador',
      sent: 'Enviada',
      paid: 'Pagada',
      overdue: 'Atrasada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Set today as default invoice date
  React.useEffect(() => {
    if (!form.getValues('invoice_date') && !initialData?.invoice_date) {
      const today = new Date().toISOString().split('T')[0];
      form.setValue('invoice_date', today);
    }
  }, [form, initialData?.invoice_date]);

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
    reset: (data?: Partial<InvoiceFormData>) => form.reset({ ...defaultValues, ...data }),
    calculateAmount,
    formatCurrency,
    getStatusColor,
    getStatusLabel
  };
};