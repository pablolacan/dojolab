// src/services/subscriptionService.ts - ORQUESTADOR/FACADE

import { getApiClient } from '../utils/api-client';
import { SubscriptionApiService } from './api/subscription-service';
import type { 
  CreateSubscriptionData, 
  UpdateSubscriptionData, 
  SubscriptionFilters,
  SubscriptionQueryOptions,
  SubscriptionStats,
  BulkOperationResult
} from './api/subscription-service';
import { 
  validateCreateSubscription, 
  validateUpdateSubscription,
  type ValidationResult 
} from '../utils/validators/subscription-validator';
import { 
  formatSubscriptionForDisplay, 
  formatCurrency, 
  formatRenewalDate,
  getFormOptions 
} from '../utils/formatters/subscription-formatter';
import type { Subscription } from '../types';

/**
 * LEGACY SUBSCRIPTION SERVICE - Mantiene compatibilidad
 * 
 * Este servicio actúa como un facade/orquestador que combina:
 * - SubscriptionApiService (operaciones de API)
 * - Validation functions (validaciones)
 * - Formatter functions (formateo)
 * 
 * Mantiene la interfaz original para evitar breaking changes mientras
 * internamente usa la nueva arquitectura modular.
 * 
 * @deprecated Para nuevo código, usa directamente SubscriptionApiService + validators + formatters
 */
class SubscriptionService {
  private apiService: SubscriptionApiService;

  constructor() {
    const apiClient = getApiClient();
    this.apiService = new SubscriptionApiService(apiClient.getApiFactory().getUtility('httpClient'));
  }

  // ==================== LEGACY API METHODS ====================

  /**
   * Obtener lista de suscripciones con filtros y paginación
   * @deprecated Use apiService.getAll() directly
   */
  async getSubscriptions(params: SubscriptionQueryOptions = {}) {
    const result = await this.apiService.getAll(params);
    
    return {
      data: result.data,
      meta: result.meta
    };
  }

  /**
   * Obtener una suscripción por ID
   * @deprecated Use apiService.getById() directly
   */
  async getSubscription(id: number): Promise<Subscription> {
    return this.apiService.getById(id);
  }

  /**
   * Crear nueva suscripción con validación
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    // Validar datos antes de crear
    const validation = validateCreateSubscription(data);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Validation errors: ${errorMessages}`);
    }

    return this.apiService.create(data);
  }

  /**
   * Actualizar suscripción existente con validación
   */
  async updateSubscription(id: number, data: UpdateSubscriptionData): Promise<Subscription> {
    // Validar datos antes de actualizar
    const validation = validateUpdateSubscription(data);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Validation errors: ${errorMessages}`);
    }

    return this.apiService.update(id, data);
  }

  /**
   * Eliminar suscripción
   * @deprecated Use apiService.delete() directly
   */
  async deleteSubscription(id: number): Promise<void> {
    return this.apiService.delete(id);
  }

  /**
   * Eliminar múltiples suscripciones
   * @deprecated Use apiService.bulkDelete() directly
   */
  async bulkDeleteSubscriptions(ids: number[]): Promise<void> {
    await this.apiService.bulkDelete(ids);
  }

  /**
   * Actualizar múltiples suscripciones
   * @deprecated Use apiService.bulkUpdate() directly
   */
  async bulkUpdateSubscriptions(
    updates: { id: number; data: UpdateSubscriptionData }[]
  ): Promise<Subscription[]> {
    // Validar cada actualización
    for (const update of updates) {
      const validation = validateUpdateSubscription(update.data);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Validation errors for subscription ${update.id}: ${errorMessages}`);
      }
    }

    return this.apiService.bulkUpdate(updates);
  }

  /**
   * Cambiar estado de suscripción
   * @deprecated Use apiService.changeStatus() directly
   */
  async changeSubscriptionStatus(
    id: number, 
    status: Subscription['status']
  ): Promise<Subscription> {
    return this.apiService.changeStatus(id, status);
  }

  /**
   * Renovar suscripción (actualizar fecha de renovación)
   * @deprecated Use apiService.renew() directly
   */
  async renewSubscription(id: number, newRenewalDate: string): Promise<Subscription> {
    return this.apiService.renew(id, newRenewalDate);
  }

  /**
   * Obtener estadísticas de suscripciones
   * @deprecated Use apiService.getStats() directly
   */
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    return this.apiService.getStats();
  }

  /**
   * Obtener suscripciones próximas a vencer
   * @deprecated Use apiService.getExpiring() directly
   */
  async getExpiringSubscriptions(daysAhead: number = 30): Promise<Subscription[]> {
    return this.apiService.getExpiring(daysAhead);
  }

  /**
   * Buscar suscripciones por término
   * @deprecated Use apiService.search() directly
   */
  async searchSubscriptions(searchTerm: string): Promise<Subscription[]> {
    return this.apiService.search(searchTerm);
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validar datos de creación
   */
  validateCreateData(data: CreateSubscriptionData): ValidationResult {
    return validateCreateSubscription(data);
  }

  /**
   * Validar datos de actualización
   */
  validateUpdateData(data: UpdateSubscriptionData): ValidationResult {
    return validateUpdateSubscription(data);
  }

  // ==================== FORMATTING METHODS ====================

  /**
   * Formatear suscripción para display en UI
   */
  formatForDisplay(subscription: Subscription) {
    return formatSubscriptionForDisplay(subscription);
  }

  /**
   * Formatear currency
   */
  formatCurrency(amount: string | number): string {
    return formatCurrency(amount);
  }

  /**
   * Formatear fecha de renovación
   */
  formatDate(dateString: string): string {
    return formatRenewalDate(dateString);
  }

  /**
   * Obtener opciones para formularios
   */
  getFormOptions() {
    return getFormOptions();
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Crear suscripción con validación y formateo de errores
   */
  async createWithValidation(data: CreateSubscriptionData): Promise<{
    success: boolean;
    subscription?: Subscription;
    errors?: string[];
  }> {
    try {
      const validation = this.validateCreateData(data);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message)
        };
      }

      const subscription = await this.createSubscription(data);
      
      return {
        success: true,
        subscription
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Actualizar suscripción con validación y formateo de errores
   */
  async updateWithValidation(id: number, data: UpdateSubscriptionData): Promise<{
    success: boolean;
    subscription?: Subscription;
    errors?: string[];
  }> {
    try {
      const validation = this.validateUpdateData(data);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(e => e.message)
        };
      }

      const subscription = await this.updateSubscription(id, data);
      
      return {
        success: true,
        subscription
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Obtener suscripciones formateadas para UI
   */
  async getSubscriptionsFormatted(params: SubscriptionQueryOptions = {}) {
    const result = await this.getSubscriptions(params);
    
    return {
      ...result,
      data: result.data.map(subscription => ({
        ...subscription,
        formatted: this.formatForDisplay(subscription)
      }))
    };
  }

  /**
   * Obtener estadísticas formateadas
   */
  async getFormattedStats() {
    const stats = await this.getSubscriptionStats();
    
    return {
      ...stats,
      formatted: {
        totalCost: this.formatCurrency(stats.totalCost),
        averageCost: this.formatCurrency(stats.averageCost),
        monthlyCost: this.formatCurrency(stats.monthlyCost),
        yearlyCost: this.formatCurrency(stats.yearlyCost)
      }
    };
  }

  // ==================== ACCESS TO SPECIALIZED SERVICES ====================

  /**
   * Obtener acceso directo al servicio de API (para migración gradual)
   */
  getApiService(): SubscriptionApiService {
    return this.apiService;
  }

  /**
   * Obtener funciones de validación (para uso directo)
   */
  getValidators() {
    return {
      validateCreate: validateCreateSubscription,
      validateUpdate: validateUpdateSubscription
    };
  }

  /**
   * Obtener funciones de formateo (para uso directo)
   */
  getFormatters() {
    return {
      formatForDisplay: formatSubscriptionForDisplay,
      formatCurrency,
      formatDate: formatRenewalDate,
      getFormOptions
    };
  }


}

// ==================== SINGLETON INSTANCE ====================

let subscriptionServiceInstance: SubscriptionService | null = null;

/**
 * Obtener instancia singleton del servicio de suscripciones
 * Lazy initialization - se crea solo cuando se necesita
 */
function getSubscriptionServiceInstance(): SubscriptionService {
  if (!subscriptionServiceInstance) {
    subscriptionServiceInstance = new SubscriptionService();
  }
  return subscriptionServiceInstance;
}

// ==================== EXPORTS ====================

// Export objeto que actúa como proxy al singleton
export const subscriptionService = {
  // Métodos principales
  get getSubscriptions() { return getSubscriptionServiceInstance().getSubscriptions.bind(getSubscriptionServiceInstance()); },
  get getSubscription() { return getSubscriptionServiceInstance().getSubscription.bind(getSubscriptionServiceInstance()); },
  get createSubscription() { return getSubscriptionServiceInstance().createSubscription.bind(getSubscriptionServiceInstance()); },
  get updateSubscription() { return getSubscriptionServiceInstance().updateSubscription.bind(getSubscriptionServiceInstance()); },
  get deleteSubscription() { return getSubscriptionServiceInstance().deleteSubscription.bind(getSubscriptionServiceInstance()); },
  get bulkDeleteSubscriptions() { return getSubscriptionServiceInstance().bulkDeleteSubscriptions.bind(getSubscriptionServiceInstance()); },
  get bulkUpdateSubscriptions() { return getSubscriptionServiceInstance().bulkUpdateSubscriptions.bind(getSubscriptionServiceInstance()); },
  get changeSubscriptionStatus() { return getSubscriptionServiceInstance().changeSubscriptionStatus.bind(getSubscriptionServiceInstance()); },
  get renewSubscription() { return getSubscriptionServiceInstance().renewSubscription.bind(getSubscriptionServiceInstance()); },
  get getSubscriptionStats() { return getSubscriptionServiceInstance().getSubscriptionStats.bind(getSubscriptionServiceInstance()); },
  get getExpiringSubscriptions() { return getSubscriptionServiceInstance().getExpiringSubscriptions.bind(getSubscriptionServiceInstance()); },
  get searchSubscriptions() { return getSubscriptionServiceInstance().searchSubscriptions.bind(getSubscriptionServiceInstance()); },
  
  // Métodos de validación
  get validateCreateData() { return getSubscriptionServiceInstance().validateCreateData.bind(getSubscriptionServiceInstance()); },
  get validateUpdateData() { return getSubscriptionServiceInstance().validateUpdateData.bind(getSubscriptionServiceInstance()); },
  
  // Métodos de formateo
  get formatForDisplay() { return getSubscriptionServiceInstance().formatForDisplay.bind(getSubscriptionServiceInstance()); },
  get formatCurrency() { return getSubscriptionServiceInstance().formatCurrency.bind(getSubscriptionServiceInstance()); },
  get formatDate() { return getSubscriptionServiceInstance().formatDate.bind(getSubscriptionServiceInstance()); },
  get getFormOptions() { return getSubscriptionServiceInstance().getFormOptions.bind(getSubscriptionServiceInstance()); },
  
  // Métodos de conveniencia
  get createWithValidation() { return getSubscriptionServiceInstance().createWithValidation.bind(getSubscriptionServiceInstance()); },
  get updateWithValidation() { return getSubscriptionServiceInstance().updateWithValidation.bind(getSubscriptionServiceInstance()); },
  get getSubscriptionsFormatted() { return getSubscriptionServiceInstance().getSubscriptionsFormatted.bind(getSubscriptionServiceInstance()); },
  get getFormattedStats() { return getSubscriptionServiceInstance().getFormattedStats.bind(getSubscriptionServiceInstance()); },
  
  // Métodos de acceso a servicios especializados
  get getApiService() { return getSubscriptionServiceInstance().getApiService.bind(getSubscriptionServiceInstance()); },
  get getValidators() { return getSubscriptionServiceInstance().getValidators.bind(getSubscriptionServiceInstance()); },
  get getFormatters() { return getSubscriptionServiceInstance().getFormatters.bind(getSubscriptionServiceInstance()); }
};

// Export default para compatibilidad
export default subscriptionService;

// Export types para nuevo código
export type {
  CreateSubscriptionData,
  UpdateSubscriptionData,
  SubscriptionFilters,
  SubscriptionQueryOptions,
  SubscriptionStats,
  BulkOperationResult,
  ValidationResult
};

// Export specialized services para migración gradual
export { SubscriptionApiService } from './api/subscription-service';
export * from '../utils/validators/subscription-validator';
export * from '../utils/formatters/subscription-formatter';