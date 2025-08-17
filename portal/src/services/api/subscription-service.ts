// src/services/api/subscription-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { Subscription } from '../../types';
import type { 
  PaginatedResponse,
  QueryOptions,
  CrudOperations
} from './types';
import { API_ENDPOINTS, buildDirectusQuery, buildUrlWithParams } from './endpoints';

// ==================== SUBSCRIPTION SPECIFIC TYPES ====================

export interface SubscriptionFilters {
  status?: string;
  plan_type?: string;
  billing_cycle?: string;
  service_name?: string;
  cost_min?: number;
  cost_max?: number;
  date_from?: string;
  date_to?: string;
}

export interface SubscriptionQueryOptions extends QueryOptions {
  filters?: SubscriptionFilters;
}

export interface CreateSubscriptionData {
  service_name: string;
  plan_type: 'free' | 'paid';
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'none';
  cost: string;
  renewal_date: string;
  status?: 'active' | 'pending' | 'cancelled' | 'expired' | 'trialing';
}

export interface UpdateSubscriptionData extends Partial<CreateSubscriptionData> {
  id?: never; // Prevenir actualizar el ID
}

export interface SubscriptionStats {
  total: number;
  active: number;
  pending: number;
  cancelled: number;
  expired: number;
  trialing: number;
  totalCost: number;
  averageCost: number;
  monthlyCost: number;
  yearlyCost: number;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: number;
    error: string;
  }>;
}

// ==================== SUBSCRIPTION API SERVICE ====================

export class SubscriptionApiService implements CrudOperations<Subscription, CreateSubscriptionData, UpdateSubscriptionData> {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Obtener todas las suscripciones con paginación y filtros
   */
  async getAll(options: SubscriptionQueryOptions = {}): Promise<PaginatedResponse<Subscription>> {
    try {
      const queryParams = this.buildSubscriptionQuery(options);
      const endpoint = buildUrlWithParams(API_ENDPOINTS.SUBSCRIPTIONS.BASE, queryParams);
      
      const response = await this.httpClient.get<PaginatedResponse<Subscription>>(endpoint);
      
      return {
        data: response.data,
        meta: response.meta || { 
          total_count: response.data.length, 
          filter_count: response.data.length 
        }
      };
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error fetching subscriptions');
    }
  }

  /**
   * Obtener suscripción por ID
   */
  async getById(id: string | number): Promise<Subscription> {
    try {
      const response = await this.httpClient.get<{ data: Subscription }>(
        API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(Number(id))
      );
      
      return response.data;
    } catch (error) {
      throw this.handleSubscriptionError(error, `Error fetching subscription ${id}`);
    }
  }

  /**
   * Crear nueva suscripción
   */
  async create(data: CreateSubscriptionData): Promise<Subscription> {
    try {
      const subscriptionData = {
        ...data,
        status: data.status || 'pending',
        date_created: new Date().toISOString(),
      };

      const response = await this.httpClient.post<{ data: Subscription }>(
        API_ENDPOINTS.SUBSCRIPTIONS.BASE,
        subscriptionData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error creating subscription');
    }
  }

  /**
   * Actualizar suscripción existente
   */
  async update(id: string | number, data: UpdateSubscriptionData): Promise<Subscription> {
    try {
      const updateData = {
        ...data,
        date_updated: new Date().toISOString(),
      };

      const response = await this.httpClient.patch<{ data: Subscription }>(
        API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(Number(id)),
        updateData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleSubscriptionError(error, `Error updating subscription ${id}`);
    }
  }

  /**
   * Eliminar suscripción
   */
  async delete(id: string | number): Promise<void> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(Number(id)));
    } catch (error) {
      throw this.handleSubscriptionError(error, `Error deleting subscription ${id}`);
    }
  }

  /**
   * Eliminar múltiples suscripciones
   */
  async bulkDelete(ids: number[]): Promise<BulkOperationResult> {
    if (ids.length === 0) {
      throw new Error('No subscriptions selected for deletion');
    }

    try {
      await this.httpClient.request(API_ENDPOINTS.SUBSCRIPTIONS.BULK_DELETE, {
        method: 'DELETE',
        body: JSON.stringify(ids)
      });

      return {
        success: ids.length,
        failed: 0,
        errors: []
      };
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error bulk deleting subscriptions');
    }
  }

  /**
   * Actualizar múltiples suscripciones
   */
  async bulkUpdate(updates: Array<{ id: number; data: UpdateSubscriptionData }>): Promise<Subscription[]> {
    if (updates.length === 0) {
      throw new Error('No updates provided');
    }

    try {
      const bulkData = updates.map(({ id, data }) => ({
        id,
        ...data,
        date_updated: new Date().toISOString(),
      }));

      const response = await this.httpClient.patch<{ data: Subscription[] }>(
        API_ENDPOINTS.SUBSCRIPTIONS.BULK_UPDATE,
        bulkData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error bulk updating subscriptions');
    }
  }

  /**
   * Cambiar estado de suscripción
   */
  async changeStatus(id: number, status: Subscription['status']): Promise<Subscription> {
    return this.update(id, { status });
  }

  /**
   * Renovar suscripción (actualizar fecha de renovación y activar)
   */
  async renew(id: number, newRenewalDate: string): Promise<Subscription> {
    return this.update(id, { 
      renewal_date: newRenewalDate,
      status: 'active'
    });
  }

  /**
   * Buscar suscripciones por término
   */
  async search(searchTerm: string, options: SubscriptionQueryOptions = {}): Promise<Subscription[]> {
    try {
      const searchOptions = {
        ...options,
        search: searchTerm,
        limit: options.limit || 50
      };

      const response = await this.getAll(searchOptions);
      return response.data;
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error searching subscriptions');
    }
  }

  /**
   * Obtener suscripciones próximas a vencer
   */
  async getExpiring(daysAhead: number = 30): Promise<Subscription[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const options: SubscriptionQueryOptions = {
        filters: {
          status: 'active',
          date_to: futureDate.toISOString().split('T')[0]
        },
        sort: ['renewal_date']
      };

      const response = await this.getAll(options);
      
      // Filtrar por fecha exacta en el cliente
      return response.data.filter(subscription => {
        const renewalDate = new Date(subscription.renewal_date);
        const today = new Date();
        return renewalDate >= today && renewalDate <= futureDate;
      });
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error fetching expiring subscriptions');
    }
  }

  /**
   * Obtener estadísticas de suscripciones
   */
  async getStats(): Promise<SubscriptionStats> {
    try {
      const response = await this.getAll({ limit: -1 }); // Obtener todas
      const subscriptions = response.data;
      
      const stats: SubscriptionStats = {
        total: subscriptions.length,
        active: 0,
        pending: 0,
        cancelled: 0,
        expired: 0,
        trialing: 0,
        totalCost: 0,
        averageCost: 0,
        monthlyCost: 0,
        yearlyCost: 0,
      };

      subscriptions.forEach(subscription => {
        // Contar por estado
        stats[subscription.status]++;
        
        const cost = parseFloat(subscription.cost);
        
        // Solo contar costos de suscripciones activas
        if (subscription.status === 'active' && cost > 0) {
          stats.totalCost += cost;
          
          // Convertir a costo mensual para comparación
          if (subscription.billing_cycle === 'monthly') {
            stats.monthlyCost += cost;
          } else if (subscription.billing_cycle === 'yearly') {
            stats.yearlyCost += cost;
            stats.monthlyCost += cost / 12; // Convertir anual a mensual
          }
        }
      });

      // Calcular promedio
      const activePaidSubscriptions = subscriptions.filter(
        s => s.status === 'active' && parseFloat(s.cost) > 0
      ).length;
      
      stats.averageCost = activePaidSubscriptions > 0 
        ? stats.totalCost / activePaidSubscriptions 
        : 0;

      return stats;
    } catch (error) {
      throw this.handleSubscriptionError(error, 'Error calculating subscription stats');
    }
  }

  /**
   * Obtener suscripciones por estado
   */
  async getByStatus(status: Subscription['status'], options: SubscriptionQueryOptions = {}): Promise<Subscription[]> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        status
      }
    };

    const response = await this.getAll(searchOptions);
    return response.data;
  }

  /**
   * Obtener suscripciones por tipo de plan
   */
  async getByPlanType(planType: 'free' | 'paid', options: SubscriptionQueryOptions = {}): Promise<Subscription[]> {
    const searchOptions = {
      ...options,
      filters: {
        ...options.filters,
        plan_type: planType
      }
    };

    const response = await this.getAll(searchOptions);
    return response.data;
  }

  /**
   * Construir query completa para suscripciones
   */
  private buildSubscriptionQuery(options: SubscriptionQueryOptions): Record<string, string> {
    return buildDirectusQuery({
      filters: options.filters,
      search: options.search,
      limit: options.limit,
      offset: options.offset,
      page: options.page,
      sort: options.sort,
      fields: options.fields
    });
  }

  /**
   * Manejo centralizado de errores de suscripciones
   */
  private handleSubscriptionError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }
}