import { z } from 'zod';

/**
 * Schemas de validación para autenticación
 */

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
    
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
    
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
});

// Schema para forgot password
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
});

// Schema para reset password
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
    
  token: z
    .string()
    .min(1, 'Reset token is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Schema para registro (para futuro)
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces'),
    
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces'),
    
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
    
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
    
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must accept the terms and conditions'
    })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Schema para cambio de contraseña
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
    
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    
  confirmNewPassword: z
    .string()
    .min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword']
});

// Tipos TypeScript derivados de los schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Valores por defecto para los formularios
export const loginDefaults: LoginFormData = {
  email: '',
  password: '',
  rememberMe: false
};

export const forgotPasswordDefaults: ForgotPasswordFormData = {
  email: ''
};

export const registerDefaults: RegisterFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
};

// Mensajes de error personalizados
export const authErrorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  passwordTooShort: 'Password must be at least 8 characters',
  passwordTooWeak: 'Password must contain uppercase, lowercase, and number',
  passwordMismatch: 'Passwords do not match',
  termsRequired: 'You must accept the terms and conditions',
  invalidCredentials: 'Invalid email or password',
  accountLocked: 'Account is temporarily locked',
  accountSuspended: 'Account has been suspended',
  tooManyAttempts: 'Too many login attempts. Please try again later'
};

// Helper para mapear errores de Directus a mensajes amigables
export const mapDirectusError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid credentials': authErrorMessages.invalidCredentials,
    'User suspended': authErrorMessages.accountSuspended,
    'Too many requests': authErrorMessages.tooManyAttempts,
    'Account locked': authErrorMessages.accountLocked
  };
  
  return errorMap[error] || error;
};