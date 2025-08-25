import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../stores/auth-store';
import { 
  loginSchema, 
  forgotPasswordSchema,
  registerSchema,
  type ForgotPasswordFormData,
  type RegisterFormData,
  loginDefaults,
  forgotPasswordDefaults,
  registerDefaults,
  mapDirectusError
} from '../lib/validations/auth-schemas';
import { auth } from '../lib';

/**
 * Hook para el formulario de login
 */
export const useLoginForm = () => {
  const authStore = useAuthStore();
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: loginDefaults,
    mode: 'onBlur' as const,
  });
  
  const onSubmit = async (data: any) => {
    try {
      // Limpiar errores previos
      form.clearErrors();
      authStore.clearError();
      
      // Intentar login
      const success = await authStore.login({
        email: data.email,
        password: data.password
      });
      
      if (!success && authStore.error) {
        // Si hay error en el store, mostrarlo en el form
        const errorMessage = authStore.error;
        form.setError('root', {
          type: 'manual',
          message: mapDirectusError(errorMessage)
        });
      }
      
      return success;
      
    } catch (error: any) {
      console.error('Login form error:', error);
      form.setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred'
      });
      return false;
    }
  };
  
  return {
    ...form,
    onSubmit,
    isLoading: authStore.isLoading,
    error: form.formState.errors.root?.message || authStore.error,
    isValid: form.formState.isValid && !form.formState.isSubmitting,
    clearError: () => {
      form.clearErrors('root');
      authStore.clearError();
    }
  };
};

/**
 * Hook para el formulario de forgot password
 */
export const useForgotPasswordForm = () => {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: forgotPasswordDefaults,
    mode: 'onBlur',
  });
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      form.clearErrors();
      setSuccess(false);
      
      const result = await auth.requestPasswordReset(data.email);
      
      if (result.success) {
        setSuccess(true);
        form.reset(); // Limpiar el formulario
      } else {
        form.setError('root', {
          type: 'manual',
          message: result.error || 'Failed to send reset email'
        });
      }
      
      return result.success;
      
    } catch (error: any) {
      console.error('Forgot password form error:', error);
      form.setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    success,
    error: form.formState.errors.root?.message,
    isValid: form.formState.isValid && !form.formState.isSubmitting
  };
};

/**
 * Hook para el formulario de registro (para futuro)
 */
export const useRegisterForm = () => {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: registerDefaults,
    mode: 'onBlur',
  });
  
  const [isLoading, setIsLoading] = React.useState(false);
  
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      form.clearErrors();
      
      // TODO: Implementar registro con Directus
      console.log('Register data:', data);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
      
    } catch (error: any) {
      console.error('Register form error:', error);
      form.setError('root', {
        type: 'manual',
        message: 'Registration failed'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    error: form.formState.errors.root?.message,
    isValid: form.formState.isValid && !form.formState.isSubmitting
  };
};

/**
 * Hook genérico para campos de formulario con errores
 */
export const useFormField = (name: string, form: any) => {
  const fieldState = form.getFieldState(name);
  const error = fieldState.error?.message;
  
  return {
    error: error || null,
    hasError: !!error,
    isValid: !error && fieldState.isDirty,
    isTouched: fieldState.isTouched,
    isDirty: fieldState.isDirty
  };
};

/**
 * Hook para manejar estados de validación en tiempo real
 */
export const useFormValidation = (form: any) => {
  const { errors, isSubmitting, isValid, isDirty } = form.formState;
  
  return {
    hasErrors: Object.keys(errors).length > 0,
    isSubmitting,
    isValid,
    isDirty,
    canSubmit: isValid && isDirty && !isSubmitting,
    errors
  };
};