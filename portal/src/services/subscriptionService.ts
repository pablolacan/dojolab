// src/services/subscriptionService.ts

import { getApiClient } from '../utils/api-client';
import type { Subscription, DirectusListResponse, DirectusResponse } from '../types';

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

export interface SubscriptionQueryParams {
  limit?: number;
  offset?: number;
  sort?: string[];
  filters?: SubscriptionFilters;
  search?: string;
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

class SubscriptionService {
  private getApiClient() {
    return getApiClient();
  }

  /**
   * Obtener lista de suscripciones con filtros y paginación
   */
  async getSubscriptions(params: SubscriptionQueryParams = {}) {
    const searchParams = new URLSearchParams();
    
    // Paginación
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    
    // Ordenamiento
    if (params.sort && params.sort.length > 0) {
      searchParams.append('sort', params.sort.join(','));
    }
    
    // Búsqueda global
    if (params.search) {
      searchParams.append('search', params.search);
    }
    
    // Filtros específicos
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'cost_min') {
            searchParams.append('filter[cost][_gte]', value.toString());
          } else if (key === 'cost_max') {
            searchParams.append('filter[cost][_lte]', value.toString());
          } else if (key === 'date_from') {
            searchParams.append('filter[date_created][_gte]', value.toString());
          } else if (key === 'date_to') {
            searchParams.append('filter[date_created][_lte]', value.toString());
          } else {
            searchParams.append(`filter[${key}][_eq]`, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/items/subscriptions${queryString ? `?${queryString}` : ''}`;
    
    const result = await this.getApiClient().request<DirectusListResponse<Subscription>>(endpoint);
    
    return {
      data: result.data,
      meta: result.meta || { total_count: result.data.length, filter_count: result.data.length }
    };
  }

  /**
   * Obtener una suscripción por ID
   */
  async getSubscription(id: number): Promise<Subscription> {
    const result = await this.getApiClient().request<DirectusResponse<Subscription>>(
      `/items/subscriptions/${id}`
    );
    return result.data;
  }

  /**
   * Crear nueva suscripción
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    // Validaciones
    this.validateSubscriptionData(data);
    
    const subscriptionData = {
      ...data,
      status: data.status || 'pending',
      date_created: new Date().toISOString(),
    };

    const result = await this.getApiClient().request<DirectusResponse<Subscription>>(
      '/items/subscriptions',
      {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      }
    );
    
    return result.data;
  }

  /**
   * Actualizar suscripción existente
   */
  async updateSubscription(id: number, data: UpdateSubscriptionData): Promise<Subscription> {
    // Validaciones
    this.validateSubscriptionData(data, true);
    
    const updateData = {
      ...data,
      date_updated: new Date().toISOString(),
    };

    const result = await this.getApiClient().request<DirectusResponse<Subscription>>(
      `/items/subscriptions/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }
    );
    
    return result.data;
  }

  /**
   * Eliminar suscripción
   */
  async deleteSubscription(id: number): Promise<void> {
    await this.getApiClient().request(`/items/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Eliminar múltiples suscripciones
   */
  async bulkDeleteSubscriptions(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      throw new Error('No hay suscripciones seleccionadas para eliminar');
    }

    await this.getApiClient().request('/items/subscriptions', {
      method: 'DELETE',
      body: JSON.stringify(ids),
    });
  }

  /**
   * Actualizar múltiples suscripciones
   */
  async bulkUpdateSubscriptions(
    updates: { id: number; data: UpdateSubscriptionData }[]
  ): Promise<Subscription[]> {
    if (updates.length === 0) {
      throw new Error('No hay actualizaciones para procesar');
    }

    const bulkData = updates.map(({ id, data }) => ({
      id,
      ...data,
      date_updated: new Date().toISOString(),
    }));

    const result = await this.getApiClient().request<DirectusResponse<Subscription[]>>(
      '/items/subscriptions',
      {
        method: 'PATCH',
        body: JSON.stringify(bulkData),
      }
    );
    
    return result.data;
  }

  /**
   * Cambiar estado de suscripción
   */
  async changeSubscriptionStatus(
    id: number, 
    status: Subscription['status']
  ): Promise<Subscription> {
    return this.updateSubscription(id, { status });
  }

  /**
   * Renovar suscripción (actualizar fecha de renovación)
   */
  async renewSubscription(id: number, newRenewalDate: string): Promise<Subscription> {
    return this.updateSubscription(id, { 
      renewal_date: newRenewalDate,
      status: 'active'
    });
  }

  /**
   * Obtener estadísticas de suscripciones
   */
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    const { data: subscriptions } = await this.getSubscriptions({ limit: -1 }); // Obtener todas
    
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
  }

  /**
   * Obtener suscripciones próximas a vencer
   */
  async getExpiringSubscriptions(daysAhead: number = 30): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const { data } = await this.getSubscriptions({
      filters: {
        status: 'active',
        date_to: futureDate.toISOString().split('T')[0]
      },
      sort: ['renewal_date']
    });
    
    return data.filter(subscription => {
      const renewalDate = new Date(subscription.renewal_date);
      const today = new Date();
      return renewalDate >= today && renewalDate <= futureDate;
    });
  }

  /**
   * Buscar suscripciones por término
   */
  async searchSubscriptions(searchTerm: string): Promise<Subscription[]> {
    const { data } = await this.getSubscriptions({
      search: searchTerm,
      limit: 50
    });
    
    return data;
  }

  /**
   * Validar datos de suscripción
   */
  private validateSubscriptionData(
    data: CreateSubscriptionData | UpdateSubscriptionData, 
    isUpdate: boolean = false
  ): void {
    const errors: string[] = [];

    if (!isUpdate && !data.service_name) {
      errors.push('El nombre del servicio es requerido');
    }

    if (data.service_name && data.service_name.trim().length < 2) {
      errors.push('El nombre del servicio debe tener al menos 2 caracteres');
    }

    if (data.cost !== undefined) {
      const cost = parseFloat(data.cost);
      if (isNaN(cost) || cost < 0) {
        errors.push('El costo debe ser un número válido mayor o igual a 0');
      }
    }

    if (data.renewal_date) {
      const renewalDate = new Date(data.renewal_date);
      if (isNaN(renewalDate.getTime())) {
        errors.push('La fecha de renovación debe ser válida');
      }
    }

    if (data.plan_type && !['free', 'paid'].includes(data.plan_type)) {
      errors.push('El tipo de plan debe ser "free" o "paid"');
    }

    if (data.billing_cycle && !['monthly', 'yearly', 'one_time', 'none'].includes(data.billing_cycle)) {
      errors.push('El ciclo de facturación debe ser válido');
    }

    if (data.status && !['active', 'pending', 'cancelled', 'expired', 'trialing'].includes(data.status)) {
      errors.push('El estado debe ser válido');
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  /**
   * Obtener opciones para formularios
   */
  getFormOptions() {
    return {
      statuses: [
        { value: 'active', label: 'Activo' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'trialing', label: 'Prueba' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'expired', label: 'Expirado' },
      ],
      planTypes: [
        { value: 'free', label: 'Gratis' },
        { value: 'paid', label: 'Pago' },
      ],
      billingCycles: [
        { value: 'monthly', label: 'Mensual' },
        { value: 'yearly', label: 'Anual' },
        { value: 'one_time', label: 'Pago único' },
        { value: 'none', label: 'Sin costo' },
      ]
    };
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionService();

// Export para compatibilidad
export default subscriptionService;