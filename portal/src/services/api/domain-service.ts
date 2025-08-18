// src/services/api/domain-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { Domain, Client, Provider, CreateDomainData, UpdateDomainData, DomainFilters, DomainStats } from '../../types/domain';
import type { PaginatedResponse, QueryOptions } from './types';
import { buildDirectusQuery, buildUrlWithParams } from './endpoints';

// Endpoints específicos para domains
const DOMAIN_ENDPOINTS = {
  BASE: '/items/Domains', // Note: Directus usa "Domains" con mayúscula
  BY_ID: (id: number) => `/items/Domains/${id}`,
  CLIENTS: '/items/clients',
  PROVIDERS: '/items/providers'
} as const;

export interface DomainQueryOptions extends QueryOptions {
  filters?: DomainFilters;
  includeRelations?: boolean;
}

export class DomainService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Obtener todos los dominios con relaciones
   */
  async getAll(options: DomainQueryOptions = {}): Promise<PaginatedResponse<Domain>> {
    try {
      const queryParams = this.buildDomainQuery(options);
      const endpoint = buildUrlWithParams(DOMAIN_ENDPOINTS.BASE, queryParams);
      
      const response = await this.httpClient.get<PaginatedResponse<Domain>>(endpoint);
      
      return {
        data: response.data,
        meta: response.meta || { 
          total_count: response.data.length, 
          filter_count: response.data.length 
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Error fetching domains');
    }
  }

  /**
   * Obtener dominio por ID
   */
  async getById(id: string | number): Promise<Domain> {
    try {
      const endpoint = `${DOMAIN_ENDPOINTS.BY_ID(Number(id))}?fields=*,client_id.*,provider_id.*`;
      const response = await this.httpClient.get<{ data: Domain }>(endpoint);
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error fetching domain ${id}`);
    }
  }

  /**
   * Crear nuevo dominio
   */
  async create(data: CreateDomainData): Promise<Domain> {
    try {
      // Validación básica
      this.validateDomainData(data);

      const domainData = {
        ...data,
        status: data.status || 'active',
        date_created: new Date().toISOString(),
      };

      const response = await this.httpClient.post<{ data: Domain }>(
        DOMAIN_ENDPOINTS.BASE,
        domainData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error creating domain');
    }
  }

  /**
   * Actualizar dominio
   */
  async update(id: string | number, data: UpdateDomainData): Promise<Domain> {
    try {
      // Validación básica para actualización
      if (data.domain_) this.validateDomainName(data.domain_);
      if (data.expiration_date) this.validateExpirationDate(data.expiration_date);
      if (data.renewal_price) this.validatePrice(data.renewal_price);

      const updateData = {
        ...data,
        date_updated: new Date().toISOString(),
      };

      const response = await this.httpClient.patch<{ data: Domain }>(
        DOMAIN_ENDPOINTS.BY_ID(Number(id)),
        updateData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error updating domain ${id}`);
    }
  }

  /**
   * Eliminar dominio
   */
  async delete(id: string | number): Promise<void> {
    try {
      await this.httpClient.delete(DOMAIN_ENDPOINTS.BY_ID(Number(id)));
    } catch (error) {
      throw this.handleError(error, `Error deleting domain ${id}`);
    }
  }

  /**
   * Obtener clientes para dropdown
   */
  async getClients(): Promise<Client[]> {
    try {
      const response = await this.httpClient.get<{ data: Client[] }>(
        `${DOMAIN_ENDPOINTS.CLIENTS}?fields=id,name,email,status&filter[status][_eq]=active&sort=name`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error fetching clients');
    }
  }

  /**
   * Obtener proveedores para dropdown
   */
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await this.httpClient.get<{ data: Provider[] }>(
        `${DOMAIN_ENDPOINTS.PROVIDERS}?fields=id,name,website,status&filter[status][_eq]=active&sort=name`
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error fetching providers');
    }
  }

  /**
   * Obtener dominios próximos a vencer
   */
  async getExpiring(daysAhead: number = 30): Promise<Domain[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const queryParams = {
        'fields': '*,client_id.*,provider_id.*',
        'filter[status][_eq]': 'active',
        'filter[expiration_date][_lte]': futureDate.toISOString().split('T')[0],
        'filter[expiration_date][_gte]': new Date().toISOString().split('T')[0],
        'sort': 'expiration_date'
      };

      const endpoint = buildUrlWithParams(DOMAIN_ENDPOINTS.BASE, queryParams);
      const response = await this.httpClient.get<{ data: Domain[] }>(endpoint);
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error fetching expiring domains');
    }
  }

  /**
   * Obtener estadísticas básicas
   */
  async getStats(): Promise<DomainStats> {
    try {
      const response = await this.getAll({ limit: -1 });
      const domains = response.data;
      
      const stats: DomainStats = {
        total: domains.length,
        active: 0,
        expired: 0,
        pending_transfer: 0,
        totalCost: 0,
        averageCost: 0,
        expiringIn30Days: 0,
        expiringIn7Days: 0,
      };

      const today = new Date();
      const in7Days = new Date();
      const in30Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      in30Days.setDate(today.getDate() + 30);

      domains.forEach(domain => {
        // Contar por estado
        stats[domain.status]++;
        
        const cost = parseFloat(domain.renewal_price || '0');
        if (domain.status === 'active' && cost > 0) {
          stats.totalCost += cost;
        }

        // Verificar expiración
        const expirationDate = new Date(domain.expiration_date);
        if (domain.status === 'active') {
          if (expirationDate <= in7Days) {
            stats.expiringIn7Days++;
          } else if (expirationDate <= in30Days) {
            stats.expiringIn30Days++;
          }
        }
      });

      // Calcular promedio
      const activePaidDomains = domains.filter(
        d => d.status === 'active' && parseFloat(d.renewal_price || '0') > 0
      ).length;
      
      stats.averageCost = activePaidDomains > 0 
        ? stats.totalCost / activePaidDomains 
        : 0;

      return stats;
    } catch (error) {
      throw this.handleError(error, 'Error calculating domain stats');
    }
  }

  /**
   * Construir query para dominios
   */
  private buildDomainQuery(options: DomainQueryOptions): Record<string, string> {
    const query = buildDirectusQuery({
      filters: options.filters,
      search: options.search,
      limit: options.limit,
      offset: options.offset,
      page: options.page,
      sort: options.sort
    });

    // Incluir relaciones por defecto
    if (options.includeRelations !== false) {
      query.fields = '*,client_id.*,provider_id.*';
    }

    return query;
  }

  /**
   * Validaciones básicas
   */
  private validateDomainData(data: CreateDomainData): void {
    this.validateDomainName(data.domain_);
    this.validateExpirationDate(data.expiration_date);
    this.validatePrice(data.renewal_price);
    
    if (!data.client_id) throw new Error('Client is required');
    if (!data.provider_id) throw new Error('Provider is required');
  }

  private validateDomainName(domain: string): void {
    if (!domain || domain.trim().length < 3) {
      throw new Error('Domain name must be at least 3 characters');
    }
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      throw new Error('Invalid domain format');
    }
  }

  private validateExpirationDate(date: string): void {
    const expirationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(expirationDate.getTime())) {
      throw new Error('Invalid expiration date');
    }
    
    if (expirationDate < today) {
      throw new Error('Expiration date cannot be in the past');
    }
  }

  private validatePrice(price: string): void {
    const numPrice = parseFloat(price);
    
    if (isNaN(numPrice) || numPrice < 0) {
      throw new Error('Price must be a valid positive number');
    }
    
    if (numPrice > 999999.99) {
      throw new Error('Price is too large');
    }
  }

  /**
   * Manejo de errores simple
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }
}