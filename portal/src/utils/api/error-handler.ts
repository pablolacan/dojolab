// src/utils/api/error-handler.ts

import type { 
  ServiceError, 
  ValidationError, 
  NetworkError 
} from '../../services/api/types';

export interface ErrorContext {
  service: string;
  operation: string;
  endpoint?: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorCount: Map<string, number> = new Map();
  private lastErrors: ServiceError[] = [];
  private maxErrorHistory = 100;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableNotifications: false,
      logLevel: 'error',
      ...config
    };
  }

  /**
   * Manejo principal de errores
   */
  handleError(error: any, context: ErrorContext): ServiceError {
    const serviceError = this.normalizeError(error, context);
    
    // Registrar error
    this.recordError(serviceError);
    
    // Log del error
    if (this.config.enableLogging) {
      this.logError(serviceError, context);
    }
    
    // Notificaciones (si están habilitadas)
    if (this.config.enableNotifications) {
      this.notifyError(serviceError, context);
    }
    
    return serviceError;
  }

  /**
   * Normalizar diferentes tipos de errores a ServiceError
   */
  private normalizeError(error: any, context: ErrorContext): ServiceError {
    const timestamp = new Date().toISOString();
    
    // Error ya es ServiceError
    if (this.isServiceError(error)) {
      return { ...error, timestamp };
    }
    
    // Error de red/fetch
    if (this.isNetworkError(error)) {
      return this.createNetworkError(error, context, timestamp);
    }
    
    // Error de validación
    if (this.isValidationError(error)) {
      return this.createValidationError(error, context, timestamp);
    }
    
    // Error HTTP estándar
    if (this.isHttpError(error)) {
      return this.createHttpError(error, context, timestamp);
    }
    
    // Error genérico
    return this.createGenericError(error, context, timestamp);
  }

  /**
   * Crear error de red
   */
  private createNetworkError(error: any, context: ErrorContext, timestamp: string): NetworkError {
    return {
      name: 'NetworkError',
      message: this.getNetworkErrorMessage(error),
      code: 'NETWORK_ERROR',
      status: 0,
      details: {
        originalError: error.message,
        service: context.service,
        operation: context.operation,
        endpoint: context.endpoint
      },
      timestamp,
      timeout: error.name === 'AbortError' || error.message?.includes('timeout'),
      offline: !navigator.onLine
    };
  }

  /**
   * Crear error de validación
   */
  private createValidationError(error: any, context: ErrorContext, timestamp: string): ValidationError {
    const field = error.field || this.extractFieldFromMessage(error.message);
    
    return {
      name: 'ValidationError',
      message: error.message || 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      details: {
        service: context.service,
        operation: context.operation
      },
      timestamp,
      field,
      value: error.value,
      rule: error.rule || 'unknown'
    };
  }

  /**
   * Crear error HTTP
   */
  private createHttpError(error: any, context: ErrorContext, timestamp: string): ServiceError {
    return {
      name: 'HttpError',
      message: this.getHttpErrorMessage(error),
      code: this.getHttpErrorCode(error.status),
      status: error.status || 500,
      details: {
        service: context.service,
        operation: context.operation,
        endpoint: context.endpoint,
        response: error.response
      },
      timestamp
    };
  }

  /**
   * Crear error genérico
   */
  private createGenericError(error: any, context: ErrorContext, timestamp: string): ServiceError {
    return {
      name: 'ServiceError',
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: error.status || 500,
      details: {
        service: context.service,
        operation: context.operation,
        originalError: error
      },
      timestamp
    };
  }

  /**
   * Determinar severidad del error
   */
  getErrorSeverity(error: ServiceError): ErrorSeverity {
    const status = error.status || 0;
    
    // Errores críticos
    if (status === 500 || status === 503) return 'critical';
    if (error.code === 'NETWORK_ERROR' && (error as NetworkError).offline) return 'critical';
    
    // Errores altos
    if (status === 401 || status === 403) return 'high';
    if (status === 404) return 'high';
    
    // Errores medios
    if (status === 400 || error.code === 'VALIDATION_ERROR') return 'medium';
    if (status === 429) return 'medium'; // Rate limiting
    
    // Errores bajos
    return 'low';
  }

  /**
   * Verificar si un error es recuperable (reintentable)
   */
  isRetryableError(error: ServiceError): boolean {
    const status = error.status || 0;
    
    // No reintentar errores de cliente (4xx)
    if (status >= 400 && status < 500) {
      // Excepto algunos específicos
      return status === 408 || status === 429; // Timeout, Rate limit
    }
    
    // Reintentar errores de servidor (5xx)
    if (status >= 500) return true;
    
    // Reintentar errores de red
    if (error.code === 'NETWORK_ERROR') {
      const networkError = error as NetworkError;
      return networkError.timeout || !networkError.offline;
    }
    
    return false;
  }

  /**
   * Ejecutar operación con retry automático
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.config.maxRetries;
    let lastError: ServiceError;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handleError(error, {
          ...context,
          operation: `${context.operation} (attempt ${attempt})`
        });
        
        // Si es el último intento o no es reintentable, lanzar error
        if (attempt > retries || !this.isRetryableError(lastError)) {
          throw lastError;
        }
        
        // Esperar antes del siguiente intento
        await this.delay(this.config.retryDelay * attempt);
      }
    }
    
    throw lastError!;
  }

  /**
   * Registrar error en historial
   */
  private recordError(error: ServiceError): void {
    // Agregar al historial
    this.lastErrors.unshift(error);
    
    // Mantener solo los últimos N errores
    if (this.lastErrors.length > this.maxErrorHistory) {
      this.lastErrors = this.lastErrors.slice(0, this.maxErrorHistory);
    }
    
    // Contar errores por tipo
    const errorKey = `${error.code}_${error.status}`;
    const currentCount = this.errorCount.get(errorKey) || 0;
    this.errorCount.set(errorKey, currentCount + 1);
  }

  /**
   * Log del error según configuración
   */
  private logError(error: ServiceError, context: ErrorContext): void {
    const severity = this.getErrorSeverity(error);
    const logLevel = this.getLogLevel(severity);
    
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status,
        timestamp: error.timestamp
      },
      context,
      severity
    };
    
    switch (logLevel) {
      case 'error':
        console.error('🔴 Service Error:', logData);
        break;
      case 'warn':
        console.warn('🟡 Service Warning:', logData);
        break;
      case 'info':
        console.info('🔵 Service Info:', logData);
        break;
      case 'debug':
        console.debug('⚪ Service Debug:', logData);
        break;
    }
  }

  /**
   * Notificar error (placeholder para sistema de notificaciones)
   */
  private notifyError(error: ServiceError, context: ErrorContext): void {
    const severity = this.getErrorSeverity(error);
    
    // Solo notificar errores críticos y altos
    if (severity === 'critical' || severity === 'high') {
      // Aquí integrarías con tu sistema de notificaciones
      console.warn('📢 Error notification:', {
        message: error.message,
        service: context.service,
        severity
      });
    }
  }

  /**
   * Obtener estadísticas de errores
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ServiceError[];
    topErrors: Array<{ type: string; count: number }>;
  } {
    const errorsByType: Record<string, number> = {};
    this.errorCount.forEach((count, key) => {
      errorsByType[key] = count;
    });
    
    const topErrors = Array.from(this.errorCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalErrors: this.lastErrors.length,
      errorsByType,
      recentErrors: this.lastErrors.slice(0, 10),
      topErrors
    };
  }

  /**
   * Limpiar historial de errores
   */
  clearErrorHistory(): void {
    this.lastErrors = [];
    this.errorCount.clear();
  }

  // ==================== UTILITY METHODS ====================

  private isServiceError(error: any): error is ServiceError {
    return error && typeof error === 'object' && 'code' in error && 'timestamp' in error;
  }

  private isNetworkError(error: any): boolean {
    return error instanceof TypeError || 
           error.name === 'NetworkError' || 
           error.name === 'AbortError' ||
           error.message?.includes('fetch') ||
           error.message?.includes('network') ||
           error.message?.includes('timeout');
  }

  private isValidationError(error: any): boolean {
    return error.name === 'ValidationError' || 
           error.code === 'VALIDATION_ERROR' ||
           (error.status === 400 && error.field);
  }

  private isHttpError(error: any): boolean {
    return error.status && typeof error.status === 'number';
  }

  private getNetworkErrorMessage(error: any): string {
    if (error.name === 'AbortError') return 'Request timeout';
    if (!navigator.onLine) return 'No internet connection';
    return error.message || 'Network error occurred';
  }

  private getHttpErrorMessage(error: any): string {
    const statusMessages: Record<number, string> = {
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden', 
      404: 'Not found',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable'
    };
    
    return error.message || statusMessages[error.status] || `HTTP ${error.status}`;
  }

  private getHttpErrorCode(status: number): string {
    if (status >= 400 && status < 500) return 'CLIENT_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
    return 'HTTP_ERROR';
  }

  private extractFieldFromMessage(message: string): string | undefined {
    const match = message.match(/field[:\s]+['"]?(\w+)['"]?/i);
    return match?.[1];
  }

  private getLogLevel(severity: ErrorSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warn';
      case 'low': return 'info';
      default: return 'debug';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}