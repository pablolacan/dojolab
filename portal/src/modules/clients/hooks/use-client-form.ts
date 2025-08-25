// src/modules/clients/hooks/use-client-form.ts

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Website } from '../types/client.types';

// Validation schema
const websiteSchema = z.object({
  url: z.string().url('Invalid URL format'),
  description: z.string().optional(),
  is_primary: z.boolean().optional()
});

const clientSchema = z.object({
  name: z.string()
    .min(1, 'Client name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long'),
    
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email is too long'),
    
  phone: z.string()
    .max(255, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
    
  status: z.enum(['active', 'inactive', 'prospect']).refine(
    (val) => ['active', 'inactive', 'prospect'].includes(val),
    { message: 'Status is required' }
  ),
  
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional()
    .or(z.literal('')),
    
  websites: z.array(websiteSchema).optional(),
  
  logo: z.string().optional()
});

export type ClientFormData = z.infer<typeof clientSchema>;

const defaultValues: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  status: 'prospect',
  notes: '',
  websites: [],
  logo: ''
};

interface UseClientFormOptions {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export const useClientForm = ({ initialData, onSubmit }: UseClientFormOptions) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData
    },
    mode: 'onBlur'
  });

  const handleSubmit = async (data: ClientFormData) => {
    try {
      form.clearErrors();
      await onSubmit(data);
      
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

  // Websites management helpers
  const addWebsite = () => {
    const currentWebsites = form.getValues('websites') || [];
    form.setValue('websites', [
      ...currentWebsites,
      { url: '', description: '', is_primary: false }
    ]);
  };

  const removeWebsite = (index: number) => {
    const currentWebsites = form.getValues('websites') || [];
    const newWebsites = currentWebsites.filter((_, i) => i !== index);
    form.setValue('websites', newWebsites);
  };

  const updateWebsite = (index: number, website: Website) => {
    const currentWebsites = form.getValues('websites') || [];
    const newWebsites = [...currentWebsites];
    newWebsites[index] = website;
    form.setValue('websites', newWebsites);
  };

  // Set primary website (only one can be primary)
  const setPrimaryWebsite = (index: number) => {
    const currentWebsites = form.getValues('websites') || [];
    const newWebsites = currentWebsites.map((website, i) => ({
      ...website,
      is_primary: i === index
    }));
    form.setValue('websites', newWebsites);
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
    
    // Websites helpers
    addWebsite,
    removeWebsite,
    updateWebsite,
    setPrimaryWebsite,
    
    // Utilities
    clearError: () => form.clearErrors('root'),
    reset: (data?: Partial<ClientFormData>) => form.reset({ ...defaultValues, ...data })
  };
};