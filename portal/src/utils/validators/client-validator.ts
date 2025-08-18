// src/utils/validators/client-validator.ts

import type { CreateClientData, UpdateClientData, ClientWebsite } from '../../types/client';

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
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

// ==================== VALIDATION RULES ====================

const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\.\']{2,}$/,
    message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, dots, and apostrophes'
  },
  email: {
    required: true,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email must be a valid email address'
  },
  phone: {
    required: false,
    minLength: 7,
    maxLength: 20,
    pattern: /^[\+\-\s\(\)0-9]{7,20}$/,
    message: 'Phone must be 7-20 characters and contain only numbers, spaces, parentheses, plus and minus signs'
  },
  status: {
    required: false,
    custom: (value: string) => ['active', 'inactive', 'prospect'].includes(value),
    message: 'Status must be one of: active, inactive, prospect'
  },
  notes: {
    required: false,
    maxLength: 2000,
    message: 'Notes must be less than 2000 characters'
  }
} as const;

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validar datos para crear cliente
 */
export function validateCreateClient(data: CreateClientData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar campos requeridos
  errors.push(...validateField('name', data.name, VALIDATION_RULES.name));
  errors.push(...validateField('email', data.email, VALIDATION_RULES.email));
  
  // Validar campos opcionales si están presentes
  if (data.phone) {
    errors.push(...validateField('phone', data.phone, VALIDATION_RULES.phone));
  }
  
  if (data.status) {
    errors.push(...validateField('status', data.status, VALIDATION_RULES.status));
  }
  
  if (data.notes) {
    errors.push(...validateField('notes', data.notes, VALIDATION_RULES.notes));
  }
  
  // Validar websites si están presentes
  if (data.websites && data.websites.length > 0) {
    errors.push(...validateWebsites(data.websites));
  }
  
  // Validaciones de negocio
  errors.push(...validateBusinessRules(data));
  
  return {
    isValid: errors.length === 0,
    errors: errors.filter(Boolean)
  };
}

/**
 * Validar datos para actualizar cliente
 */
export function validateUpdateClient(data: UpdateClientData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar solo campos proporcionados
  if (data.name !== undefined) {
    errors.push(...validateField('name', data.name, VALIDATION_RULES.name));
  }
  
  if (data.email !== undefined) {
    errors.push(...validateField('email', data.email, VALIDATION_RULES.email));
  }
  
  if (data.phone !== undefined) {
    errors.push(...validateField('phone', data.phone, VALIDATION_RULES.phone));
  }
  
  if (data.status !== undefined) {
    errors.push(...validateField('status', data.status, VALIDATION_RULES.status));
  }
  
  if (data.notes !== undefined) {
    errors.push(...validateField('notes', data.notes, VALIDATION_RULES.notes));
  }
  
  // Validar websites si están presentes
  if (data.websites !== undefined) {
    if (data.websites.length > 0) {
      errors.push(...validateWebsites(data.websites));
    }
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
 * Validar websites del cliente
 */
function validateWebsites(websites: ClientWebsite[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (websites.length > 10) {
    errors.push({
      field: 'websites',
      message: 'Maximum 10 websites allowed per client',
      code: 'TOO_MANY_WEBSITES'
    });
  }
  
  let primaryCount = 0;
  
  websites.forEach((website, index) => {
    const fieldPrefix = `websites[${index}]`;
    
    // Validar URL
    if (!website.url || website.url.trim() === '') {
      errors.push({
        field: `${fieldPrefix}.url`,
        message: 'Website URL is required',
        code: 'REQUIRED'
      });
    } else {
      // Validar formato de URL
      if (!isValidUrl(website.url)) {
        errors.push({
          field: `${fieldPrefix}.url`,
          message: 'Invalid URL format',
          code: 'INVALID_URL'
        });
      }
    }
    
    // Validar descripción
    if (website.description && website.description.length > 200) {
      errors.push({
        field: `${fieldPrefix}.description`,
        message: 'Website description must be less than 200 characters',
        code: 'MAX_LENGTH'
      });
    }
    
    // Contar websites primarios
    if (website.is_primary) {
      primaryCount++;
    }
  });
  
  // Solo un website puede ser primario
  if (primaryCount > 1) {
    errors.push({
      field: 'websites',
      message: 'Only one website can be marked as primary',
      code: 'MULTIPLE_PRIMARY'
    });
  }
  
  return errors;
}

/**
 * Validaciones de reglas de negocio
 */
function validateBusinessRules(data: Partial<CreateClientData>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Regla: Si el cliente está activo, debe tener al menos un website o dominio
  // (Esta regla se puede implementar cuando tengamos la lógica de dominios)
  
  // Regla: Email debe ser único (esto se debe validar en el backend)
  // Por ahora solo validamos formato
  
  // Regla: Nombres de clientes no pueden ser solo números
  if (data.name && /^\d+$/.test(data.name.trim())) {
    errors.push({
      field: 'name',
      message: 'Client name cannot be only numbers',
      code: 'INVALID_NAME_FORMAT'
    });
  }
  
  return errors;
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validar nombre de cliente específicamente
 */
export function validateClientName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name || !name.trim()) {
    errors.push({
      field: 'name',
      message: 'Client name is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    errors.push({
      field: 'name',
      message: 'Client name must be at least 2 characters',
      code: 'TOO_SHORT'
    });
  }
  
  if (trimmedName.length > 100) {
    errors.push({
      field: 'name',
      message: 'Client name must be no more than 100 characters',
      code: 'TOO_LONG'
    });
  }
  
  // Validar caracteres permitidos
  if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\.\']{2,}$/.test(trimmedName)) {
    errors.push({
      field: 'name',
      message: 'Client name contains invalid characters',
      code: 'INVALID_CHARACTERS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar email específicamente
 */
export function validateClientEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email || !email.trim()) {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length > 255) {
    errors.push({
      field: 'email',
      message: 'Email must be no more than 255 characters',
      code: 'TOO_LONG'
    });
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar teléfono específicamente
 */
export function validateClientPhone(phone: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!phone || phone.trim() === '') {
    return { isValid: true, errors }; // Phone is optional
  }
  
  const trimmedPhone = phone.trim();
  
  if (trimmedPhone.length < 7) {
    errors.push({
      field: 'phone',
      message: 'Phone must be at least 7 characters',
      code: 'TOO_SHORT'
    });
  }
  
  if (trimmedPhone.length > 20) {
    errors.push({
      field: 'phone',
      message: 'Phone must be no more than 20 characters',
      code: 'TOO_LONG'
    });
  }
  
  // Validar formato de teléfono
  const phoneRegex = /^[\+\-\s\(\)0-9]{7,20}$/;
  if (!phoneRegex.test(trimmedPhone)) {
    errors.push({
      field: 'phone',
      message: 'Invalid phone format',
      code: 'INVALID_FORMAT'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar URL específicamente
 */
export function validateWebsiteUrl(url: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!url || url.trim() === '') {
    errors.push({
      field: 'url',
      message: 'URL is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  if (!isValidUrl(url)) {
    errors.push({
      field: 'url',
      message: 'Invalid URL format',
      code: 'INVALID_URL'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validar formato de URL
 */
function isValidUrl(url: string): boolean {
  try {
    // Agregar protocolo si no lo tiene
    const urlToTest = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
    
    const urlObj = new URL(urlToTest);
    
    // Verificar que tenga un hostname válido
    return urlObj.hostname.includes('.') && urlObj.hostname.length > 3;
  } catch {
    return false;
  }
}

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

/**
 * Validar formulario completo y retornar errores agrupados
 */
export function validateClientForm(data: CreateClientData | UpdateClientData, mode: 'create' | 'update'): {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string>;
  summary: string[];
} {
  const validation = mode === 'create' 
    ? validateCreateClient(data as CreateClientData)
    : validateUpdateClient(data as UpdateClientData);
  
  const fieldErrors = getFirstErrorByField(validation.errors);
  const summary = formatValidationErrors(validation.errors);
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    fieldErrors,
    summary
  };
}