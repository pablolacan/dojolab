// src/utils/validators/invoice-validator.ts

import type { CreateInvoiceData, UpdateInvoiceData } from '../../types/invoice';

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
  invoice_number: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9\-]{3,50}$/,
    message: 'Invoice number must be 3-50 characters and contain only letters, numbers, and hyphens'
  },
  client_id: {
    required: true,
    min: 1,
    custom: (value: number) => Number.isInteger(value) && value > 0,
    message: 'Client is required and must be valid'
  },
  amount: {
    required: true,
    min: 0.01,
    max: 999999999.99,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Amount must be a valid positive number with up to 2 decimal places'
  },
  invoice_date: {
    required: true,
    custom: (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message: 'Invoice date must be a valid date'
  },
  status: {
    required: false,
    custom: (value: string) => ['draft', 'sent', 'paid', 'overdue'].includes(value),
    message: 'Status must be one of: draft, sent, paid, overdue'
  },
  notes: {
    required: false,
    maxLength: 2000,
    message: 'Notes must be less than 2000 characters'
  },
  invoice_file: {
    required: false,
    pattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
    message: 'Invoice file must be a valid UUID'
  }
} as const;

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validar datos para crear factura
 */
export function validateCreateInvoice(data: CreateInvoiceData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar campos requeridos
  errors.push(...validateField('invoice_number', data.invoice_number, VALIDATION_RULES.invoice_number));
  errors.push(...validateField('client_id', data.client_id, VALIDATION_RULES.client_id));
  errors.push(...validateField('amount', data.amount, VALIDATION_RULES.amount));
  errors.push(...validateField('invoice_date', data.invoice_date, VALIDATION_RULES.invoice_date));
  
  // Validar campos opcionales si están presentes
  if (data.status) {
    errors.push(...validateField('status', data.status, VALIDATION_RULES.status));
  }
  
  if (data.notes) {
    errors.push(...validateField('notes', data.notes, VALIDATION_RULES.notes));
  }
  
  if (data.invoice_file) {
    errors.push(...validateField('invoice_file', data.invoice_file, VALIDATION_RULES.invoice_file));
  }
  
  // Validaciones de negocio
  errors.push(...validateBusinessRules(data));
  
  return {
    isValid: errors.length === 0,
    errors: errors.filter(Boolean)
  };
}

/**
 * Validar datos para actualizar factura
 */
export function validateUpdateInvoice(data: UpdateInvoiceData): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validar solo campos proporcionados
  if (data.invoice_number !== undefined) {
    errors.push(...validateField('invoice_number', data.invoice_number, VALIDATION_RULES.invoice_number));
  }
  
  if (data.client_id !== undefined) {
    errors.push(...validateField('client_id', data.client_id, VALIDATION_RULES.client_id));
  }
  
  if (data.amount !== undefined) {
    errors.push(...validateField('amount', data.amount, VALIDATION_RULES.amount));
  }
  
  if (data.invoice_date !== undefined) {
    errors.push(...validateField('invoice_date', data.invoice_date, VALIDATION_RULES.invoice_date));
  }
  
  if (data.status !== undefined) {
    errors.push(...validateField('status', data.status, VALIDATION_RULES.status));
  }
  
  if (data.notes !== undefined) {
    errors.push(...validateField('notes', data.notes, VALIDATION_RULES.notes));
  }
  
  if (data.invoice_file !== undefined) {
    errors.push(...validateField('invoice_file', data.invoice_file, VALIDATION_RULES.invoice_file));
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
  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
    const numValue = typeof value === 'number' ? value : Number(value);
    
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
function validateBusinessRules(data: Partial<CreateInvoiceData>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Regla: Si el estado es 'paid', la fecha de factura no puede ser futura
  if (data.status === 'paid' && data.invoice_date) {
    const invoiceDate = new Date(data.invoice_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Final del día
    
    if (invoiceDate > today) {
      errors.push({
        field: 'invoice_date',
        message: 'Paid invoices cannot have future dates',
        code: 'PAID_FUTURE_DATE'
      });
    }
  }
  
  // Regla: Si el estado es 'overdue', debe tener una fecha pasada
  if (data.status === 'overdue' && data.invoice_date) {
    const invoiceDate = new Date(data.invoice_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (invoiceDate > thirtyDaysAgo) {
      errors.push({
        field: 'status',
        message: 'Invoices less than 30 days old cannot be marked as overdue',
        code: 'OVERDUE_TOO_RECENT'
      });
    }
  }
  
  // Regla: Facturas con monto 0 no pueden estar en estado 'paid'
  if (data.status === 'paid' && data.amount) {
    const amount = parseFloat(data.amount);
    if (amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Paid invoices must have an amount greater than zero',
        code: 'PAID_ZERO_AMOUNT'
      });
    }
  }
  
  // Regla: Número de factura debe seguir un formato específico para auto-generados
  if (data.invoice_number && data.invoice_number.startsWith('INV-')) {
    const pattern = /^INV-\d{4}-\d{2}-\d{3}$/;
    if (!pattern.test(data.invoice_number)) {
      errors.push({
        field: 'invoice_number',
        message: 'Auto-generated invoice numbers must follow format: INV-YYYY-MM-NNN',
        code: 'INVALID_AUTO_FORMAT'
      });
    }
  }
  
  return errors;
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validar número de factura específicamente
 */
export function validateInvoiceNumber(invoiceNumber: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!invoiceNumber || !invoiceNumber.trim()) {
    errors.push({
      field: 'invoice_number',
      message: 'Invoice number is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const trimmedNumber = invoiceNumber.trim();
  
  if (trimmedNumber.length < 3) {
    errors.push({
      field: 'invoice_number',
      message: 'Invoice number must be at least 3 characters',
      code: 'TOO_SHORT'
    });
  }
  
  if (trimmedNumber.length > 50) {
    errors.push({
      field: 'invoice_number',
      message: 'Invoice number must be no more than 50 characters',
      code: 'TOO_LONG'
    });
  }
  
  // Validar caracteres permitidos (letras, números, guiones)
  if (!/^[A-Z0-9\-]{3,50}$/i.test(trimmedNumber)) {
    errors.push({
      field: 'invoice_number',
      message: 'Invoice number can only contain letters, numbers, and hyphens',
      code: 'INVALID_CHARACTERS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar monto específicamente
 */
export function validateInvoiceAmount(amount: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!amount || amount.trim() === '') {
    errors.push({
      field: 'amount',
      message: 'Amount is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    errors.push({
      field: 'amount',
      message: 'Amount must be a valid number',
      code: 'INVALID_NUMBER'
    });
  } else if (numAmount < 0) {
    errors.push({
      field: 'amount',
      message: 'Amount cannot be negative',
      code: 'NEGATIVE_VALUE'
    });
  } else if (numAmount > 999999999.99) {
    errors.push({
      field: 'amount',
      message: 'Amount is too large',
      code: 'VALUE_TOO_LARGE'
    });
  }
  
  // Validar decimales
  const decimalPart = amount.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    errors.push({
      field: 'amount',
      message: 'Amount can have at most 2 decimal places',
      code: 'TOO_MANY_DECIMALS'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar fecha de factura específicamente
 */
export function validateInvoiceDate(date: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!date) {
    errors.push({
      field: 'invoice_date',
      message: 'Invoice date is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  const invoiceDate = new Date(date);
  
  if (isNaN(invoiceDate.getTime())) {
    errors.push({
      field: 'invoice_date',
      message: 'Invalid date format',
      code: 'INVALID_DATE'
    });
  } else {
    // Verificar que la fecha no sea demasiado antigua (más de 10 años)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (invoiceDate < tenYearsAgo) {
      errors.push({
        field: 'invoice_date',
        message: 'Invoice date cannot be more than 10 years ago',
        code: 'DATE_TOO_OLD'
      });
    }
    
    // Verificar que la fecha no sea demasiado futura (más de 1 año)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (invoiceDate > oneYearFromNow) {
      errors.push({
        field: 'invoice_date',
        message: 'Invoice date cannot be more than 1 year in the future',
        code: 'DATE_TOO_FUTURE'
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar cliente específicamente
 */
export function validateInvoiceClient(clientId: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!clientId || clientId <= 0) {
    errors.push({
      field: 'client_id',
      message: 'Client is required',
      code: 'REQUIRED'
    });
    return { isValid: false, errors };
  }
  
  if (!Number.isInteger(clientId)) {
    errors.push({
      field: 'client_id',
      message: 'Client ID must be a valid integer',
      code: 'INVALID_ID'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar archivo UUID específicamente
 */
export function validateInvoiceFile(fileId: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!fileId || fileId.trim() === '') {
    return { isValid: true, errors }; // File is optional
  }
  
  const trimmedFileId = fileId.trim();
  
  // Validar formato UUID
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuidRegex.test(trimmedFileId)) {
    errors.push({
      field: 'invoice_file',
      message: 'Invalid file ID format',
      code: 'INVALID_UUID'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar transición de estado
 */
export function validateStatusTransition(
  currentStatus: string, 
  newStatus: string
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Definir transiciones válidas
  const validTransitions: Record<string, string[]> = {
    'draft': ['sent', 'paid'], // Borrador puede ir a enviada o pagada directamente
    'sent': ['paid', 'overdue'], // Enviada puede ir a pagada o atrasada
    'paid': [], // Pagada es estado final, no puede cambiar
    'overdue': ['paid'] // Atrasada solo puede ir a pagada
  };
  
  const allowedTransitions = validTransitions[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    errors.push({
      field: 'status',
      message: `Cannot change status from ${currentStatus} to ${newStatus}`,
      code: 'INVALID_TRANSITION'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar datos para marcado automático como vencida
 */
export function validateOverdueMarking(invoiceDate: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  const invoice = new Date(invoiceDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - invoice.getTime()) / (1000 * 60 * 60 * 24));
  
  // Solo marcar como vencida si han pasado más de 30 días
  if (daysDiff < 30) {
    errors.push({
      field: 'status',
      message: 'Invoice must be at least 30 days old to be marked as overdue',
      code: 'OVERDUE_TOO_RECENT'
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

/**
 * Validar formulario completo y retornar errores agrupados
 */
export function validateInvoiceForm(
  data: CreateInvoiceData | UpdateInvoiceData, 
  mode: 'create' | 'update'
): {
  isValid: boolean;
  errors: ValidationError[];
  fieldErrors: Record<string, string>;
  summary: string[];
} {
  const validation = mode === 'create' 
    ? validateCreateInvoice(data as CreateInvoiceData)
    : validateUpdateInvoice(data as UpdateInvoiceData);
  
  const fieldErrors = getFirstErrorByField(validation.errors);
  const summary = formatValidationErrors(validation.errors);
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    fieldErrors,
    summary
  };
}

/**
 * Validar conjunto de facturas para operaciones en lote
 */
export function validateBulkInvoices(
  invoices: CreateInvoiceData[]
): {
  isValid: boolean;
  results: Array<{
    index: number;
    isValid: boolean;
    errors: ValidationError[];
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
} {
  const results = invoices.map((invoice, index) => {
    const validation = validateCreateInvoice(invoice);
    return {
      index,
      isValid: validation.isValid,
      errors: validation.errors
    };
  });
  
  const validCount = results.filter(r => r.isValid).length;
  
  return {
    isValid: validCount === invoices.length,
    results,
    summary: {
      total: invoices.length,
      valid: validCount,
      invalid: invoices.length - validCount
    }
  };
}