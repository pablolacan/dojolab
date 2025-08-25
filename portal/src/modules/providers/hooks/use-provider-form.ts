// src/modules/providers/hooks/use-provider-form.ts

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const providerSchema = z.object({
  name: z.string()
    .min(1, 'Provider name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long'),
    
  website: z.string()
    .max(255, 'Website URL is too long')
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
      'Website must be a valid URL starting with http:// or https://'
    ),
    
  contact_info: z.string()
    .max(255, 'Contact info is too long')
    .optional()
    .or(z.literal('')),
    
  status: z.enum(['active', 'expired']).optional(),
  
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional()
    .or(z.literal(''))
});

export type ProviderFormData = z.infer<typeof providerSchema>;

const defaultValues: ProviderFormData = {
  name: '',
  website: '',
  contact_info: '',
  status: 'active',
  notes: ''
};

interface UseProviderFormOptions {
  initialData?: Partial<ProviderFormData>;
  onSubmit: (data: ProviderFormData) => Promise<void>;
}

export const useProviderForm = ({ initialData, onSubmit }: UseProviderFormOptions) => {
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      ...defaultValues,
      ...initialData
    },
    mode: 'onBlur'
  });

  const handleSubmit = async (data: ProviderFormData) => {
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
    reset: (data?: Partial<ProviderFormData>) => form.reset({ ...defaultValues, ...data })
  };
};