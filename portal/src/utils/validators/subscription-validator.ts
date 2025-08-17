// src/utils/validators/subscription-validator.ts

import type { 
  CreateSubscriptionData, 
  UpdateSubscriptionData 
} from '../../services/api/subscription-service';

// ==================== VALIDATION RESULT TYPES ====================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

// ==================== VALIDATION RULES ====================

const VALIDATION_RULES = {
  service_name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
    message: 'Service name must be 2-100 characters and contain only letters, numbers, spaces, hyphens, underscores, and dots'
  },
  cost: {
    required: true,
    min: 0,
    max: 999999.99,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Cost must be a valid number with up to 2 decimal places'
  },
  renewal_date: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message: 'Renewal date must be a valid future date'
  },
  plan_type: {
    required: true,
    custom: (value: string) => ['free', 'paid'].includes(value),
    message: 'Plan type must be either "free" or "paid"'
  },
  billing_cycle: {
    required: true,
    custom: (value: string) => ['monthly', 'yearly', 'one_time', 'none'].includes(value),
    message: 'Billing cycle must be one of: monthly, yearly, one_time, none'
  },
  status: {
    required: false,
    custom: (value: string) => ['active', 'pending', 'cancelled', 'expired', 'trialing'].includes(value),
    message: 'Status must be one of: active, pending, cancelled, expired, trialing'
  }
} as const;

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validar datos para crear suscripción
 */
export function validateCreateSubscription(data: CreateSubscriptionData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar campos requeridos
  errors.push(...validateField('service_name', data.service_name, VALIDATION_RULES.service_name));
  errors.push(...validateField('cost', data.cost, VALIDATION_RULES.cost));
  errors.push(...validateField('renewal_date', data.renewal_date, VALIDATION_RULES.renewal_date));
  errors.push(...validateField('plan_type', data.plan_type, VALIDATION_RULES.plan_type));
  errors.push(...validateField('billing_cycle', data.billing_cycle, VALIDATION_RULES.billing_cycle));
  
  // Validar status si se proporciona
  if (data.status) {
    errors.push(...validateField('status', data.status, VALIDATION_RULES.status));
  }
  
  // Validaciones de negocio
  errors.push(...validateBusinessRules(data));
  
  return {
    isValid: errors.length === 0,
    errors: errors.filter(Boolean)
  };
}

/**
 * Validar datos para actualizar suscripción
 */
export function validateUpdateSubscription(data: UpdateSubscriptionData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar solo campos proporcionados
  if (data.service_name !== undefined) {
    errors.push(...validateField('service_name', data.service_name, VALIDATION_RULES.service_name));
  }
  
  if (data.cost !== undefined) {
    errors.push(...validateField('cost', data.cost, VALIDATION_RULES.cost));
  }
  
  if (data.renewal_date !== undefined) {
    errors.push(...validateField('renewal_date', data.renewal_date, VALIDATION_RULES.renewal_date));
  }
  
  if (data.plan_type !== undefined) {
    errors.push(...validateField('plan_type', data.plan_type, VALIDATION_RULES.plan_type));
  }
  
  if (data.billing_cycle !== undefined) {
    errors.push(...validateField('billing_cycle', data.billing_cycle, VALIDATION_RULES.billing_cycle));
  }
  
  if (data.status !== undefined) {
    errors.push(...validateField('status', data.status, VALIDATION_RULES.status));
  }
  
  // Validaciones de negocio para actualización
  errors.push(...validateBusinessRules(data));
  
  return {
    isValid: errors.length === 0,
    errors: errors.filter(Boolean)
  };
}

/**
 * Validar un campo específico contra sus reglas
 */
function validateField(fieldName: string, value: any, rules: FieldValidationRule): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required validation
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED',
      value
    });
    return errors; // Si es requerido y está vacío, no validar más
  }
  
  // Skip validation if value is empty and not required
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return errors;
  }
  
  // String length validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rules.minLength} characters`,
        code: 'MIN_LENGTH',
        value
      });
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${rules.maxLength} characters`,
        code: 'MAX_LENGTH',
        value
      });
    }
  }
  
  // Numeric validations
  if (typeof value === 'string' && !isNaN(Number(value))) {
    const numValue = Number(value);
    
    if (rules.min !== undefined && numValue < rules.min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rules.min}`,
        code: 'MIN_VALUE',
        value
      });
    }
    
    if (rules.max !== undefined && numValue > rules.max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${rules.max}`,
        code: 'MAX_VALUE',
        value
      });
    }
  }
  
  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push({
      field: fieldName,
      message: rules.message || `${fieldName} format is invalid`,
      code: 'INVALID_FORMAT',
      value
    });
  }
  
  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    errors.push({
      field: fieldName,
      message: rules.message || `${fieldName} is invalid`,
      code: 'CUSTOM_VALIDATION',
      value
    });
  }
  
  return errors;
}

/**
 * Validaciones de reglas de negocio
 */
function validateBusinessRules(data: Partial<CreateSubscriptionData>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Regla: Si el plan es gratis, el costo debe ser 0
  if (data.plan_type === 'free' && data.cost && parseFloat(data.cost) > 0) {
    errors.push({
      field: 'cost',
      message: 'Free plans must have zero cost',
      code: 'FREE_PLAN_COST'
    });
  }
  
  // Regla: Si el plan es pago, el costo debe ser mayor a 0
  if (data.plan_type === 'paid' && data.cost && parseFloat(data.cost) <= 0) {
    errors.push({
      field: 'cost',
      message: 'Paid plans must have a cost greater than zero',
      code: 'PAID_PLAN_COST'
    });
  }
  
  // Regla: Si billing_cycle es 'none', el costo debe ser 0
  if (data.billing_cycle === 'none' && data.cost && parseFloat(data.cost) > 0) {
    errors.push({
      field: 'cost',
      message: 'Services with no billing cycle must have zero cost',
      code: 'NO_BILLING_COST'
    });
  }
  
  // Regla: Si billing_cycle es 'one_time', no puede ser recurring
  if (data.billing_cycle === 'one_time' && data.status === 'active') {
    // Esta es más una advertencia, pero podría ser válida
  }
  
  return errors;
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validar fecha de renovación específicamente
 */
export function validateRenewalDate(date: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!date) {
    errors.push({
      field: 'renewal_date',
      message: 'Renewal date is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const renewalDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  if (isNaN(renewalDate.getTime())) {
    errors.push({
      field: 'renewal_date',
      message: 'Invalid date format',
      code: 'INVALID_DATE'
    });
  } else if (renewalDate < today) {
    errors.push({
      field: 'renewal_date',
      message: 'Renewal date cannot be in the past',
      code: 'PAST_DATE'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar costo específicamente
 */
export function validateCost(cost: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!cost) {
    errors.push({
      field: 'cost',
      message: 'Cost is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const numCost = parseFloat(cost);
  
  if (isNaN(numCost)) {
    errors.push({
      field: 'cost',
      message: 'Cost must be a valid number',
      code: 'INVALID_NUMBER'
    });
  } else if (numCost < 0) {
    errors.push({
      field: 'cost',
      message: 'Cost cannot be negative',
      code: 'NEGATIVE_VALUE'
    });
  } else if (numCost > 999999.99) {
    errors.push({
      field: 'cost',
      message: 'Cost is too large',
      code: 'VALUE_TOO_LARGE'
    });
  }
  
  // Validar decimales
  const decimalPart = cost.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    errors.push({
      field: 'cost',
      message: 'Cost can have at most 2 decimal places',
      code: 'TOO_MANY_DECIMALS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar nombre de servicio específicamente
 */
export function validateServiceName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name || !name.trim()) {
    errors.push({
      field: 'service_name',
      message: 'Service name is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    errors.push({
      field: 'service_name',
      message: 'Service name must be at least 2 characters',
      code: 'TOO_SHORT'
    });
  }
  
  if (trimmedName.length > 100) {
    errors.push({
      field: 'service_name',
      message: 'Service name must be no more than 100 characters',
      code: 'TOO_LONG'
    });
  }
  
  // Caracteres permitidos: letras, números, espacios, guiones, guiones bajos, puntos
  if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(trimmedName)) {
    errors.push({
      field: 'service_name',
      message: 'Service name contains invalid characters',
      code: 'INVALID_CHARACTERS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convertir errores de validación a mensajes legibles
 */
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => error.message);
}

/**
 * Obtener primer error por campo
 */
export function getFirstErrorByField(errors: ValidationError[]): Record<string, string> {
  const errorsByField: Record<string, string> = {};
  
  errors.forEach(error => {
    if (!errorsByField[error.field]) {
      errorsByField[error.field] = error.message;
    }
  });
  
  return errorsByField;
}

/**
 * Verificar si hay errores para un campo específico
 */
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some(error => error.field === fieldName);
}

/**
 * Obtener errores para un campo específico
 */
export function getFieldErrors(errors: ValidationError[], fieldName: string): ValidationError[] {
  return errors.filter(error => error.field === fieldName);
}