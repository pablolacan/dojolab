// src/services/api/client-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { 
  Client, 
  CreateClientData, 
  UpdateClientData, 
  ClientFilters, 
  ClientStats,
  ClientWithRelations,
  ClientOption
} from '../../types/client';
import type { PaginatedResponse, QueryOptions } from './types';
import { buildDirectusQuery, buildUrlWithParams } from './endpoints';

// Endpoints específicos para clients
const CLIENT_ENDPOINTS = {
  BASE: '/items/clients',
  BY_ID: (id: number) => `/items/clients/${id}`,
  WITH_RELATIONS: (id: number) => `/items/clients/${id}?fields=*,domains.*,invoices.*`,
  SEARCH: '/items/clients',
  OPTIONS: '/items/clients?fields=id,name,email,status&filter[status][_eq]=active'
} as const;

export interface ClientQueryOptions extends QueryOptions {
  filters?: ClientFilters;
  includeRelations?: boolean;
  includeCounts?: boolean;
}

export class ClientService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Obtener todos los clientes con filtros y paginación
   */
  async getAll(options: ClientQueryOptions = {}): Promise<PaginatedResponse<Client>> {
    try {
      const queryParams = this.buildClientQuery(options);
      const endpoint = buildUrlWithParams(CLIENT_ENDPOINTS.BASE, queryParams);
      
      const response = await this.httpClient.get<PaginatedResponse<Client>>(endpoint);
      
      return {
        data: response.data,
        meta: response.meta || { 
          total_count: response.data.length, 
          filter_count: response.data.length 
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Error fetching clients');
    }
  }

  /**
   * Obtener cliente por ID
   */
  async getById(id: string | number): Promise<Client> {
    try {
      const response = await this.httpClient.get<{ data: Client }>(
        CLIENT_ENDPOINTS.BY_ID(Number(id))
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error fetching client ${id}`);
    }
  }

  /**
   * Obtener cliente con relaciones (dominios, facturas)
   */
  async getByIdWithRelations(id: string | number): Promise<ClientWithRelations> {
    try {
      const response = await this.httpClient.get<{ data: ClientWithRelations }>(
        CLIENT_ENDPOINTS.WITH_RELATIONS(Number(id))
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error fetching client ${id} with relations`);
    }
  }

  /**
   * Crear nuevo cliente
   */
  async create(data: CreateClientData): Promise<Client> {
    try {
      // Validación básica
      this.validateClientData(data);

      const clientData = {
        ...data,
        status: data.status || 'prospect',
        date_created: new Date().toISOString(),
      };

      const response = await this.httpClient.post<{ data: Client }>(
        CLIENT_ENDPOINTS.BASE,
        clientData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error creating client');
    }
  }

  /**
   * Actualizar cliente
   */
  async update(id: string | number, data: UpdateClientData): Promise<Client> {
    try {
      // Validación básica para actualización
      if (data.name) this.validateName(data.name);
      if (data.email) this.validateEmail(data.email);
      if (data.phone) this.validatePhone(data.phone);

      const updateData = {
        ...data,
        date_updated: new Date().toISOString(),
      };

      const response = await this.httpClient.patch<{ data: Client }>(
        CLIENT_ENDPOINTS.BY_ID(Number(id)),
        updateData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error updating client ${id}`);
    }
  }

  /**
   * Eliminar cliente
   */
  async delete(id: string | number): Promise<void> {
    try {
      await this.httpClient.delete(CLIENT_ENDPOINTS.BY_ID(Number(id)));
    } catch (error) {
      throw this.handleError(error, `Error deleting client ${id}`);
    }
  }

  /**
   * Cambiar estado del cliente
   */
  async changeStatus(id: number, status: Client['status']): Promise<Client> {
    return this.update(id, { status });
  }

  /**
   * Buscar clientes por término
   */
  async search(searchTerm: string, options: ClientQueryOptions = {}): Promise<Client[]> {
    try {
      const searchOptions = {
        ...options,
        search: searchTerm,
        limit: options.limit || 50
      };

      const response = await this.getAll(searchOptions);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error searching clients');
    }
  }

  /**
   * Obtener clientes para dropdown/select
   */
  async getOptions(): Promise<ClientOption[]> {
    try {
      const response = await this.httpClient.get<{ data: ClientOption[] }>(
        CLIENT_ENDPOINTS.OPTIONS
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error fetching client options');
    }
  }

  /**
   * Verificar si email ya existe
   */
  async checkEmailExists(email: string, excludeId?: number): Promise<boolean> {
    try {
      const filters: Record<string, any> = { email };
      
      if (excludeId) {
        filters['id[_neq]'] = excludeId;
      }

      const queryParams = buildDirectusQuery({
        filters,
        limit: 1,
        fields: ['id']
      });

      const endpoint = buildUrlWithParams(CLIENT_ENDPOINTS.BASE, queryParams);
      const response = await this.httpClient.get<PaginatedResponse<{ id: number }>>(endpoint);
      
      return response.data.length > 0;
    } catch (error) {
      throw this.handleError(error, 'Error checking email availability');
    }
  }

  /**
   * Obtener estadísticas de clientes
   */
  async getStats(): Promise<ClientStats> {
    try {
      const response = await this.getAll({ limit: -1 });
      const clients = response.data;
      
      const stats: ClientStats = {
        total: clients.length,
        active: 0,
        inactive: 0,
        prospect: 0,
        totalDomains: 0,
        totalInvoices: 0,
        totalRevenue: 0,
        averageDomainsPerClient: 0
      };

      clients.forEach(client => {
        // Contar por estado
        stats[client.status]++;
      });

      // TODO: Aquí podrías hacer queries adicionales para obtener:
      // - Número de dominios por cliente
      // - Número de facturas por cliente  
      // - Revenue total por cliente
      // Por ahora dejamos valores básicos

      return stats;
    } catch (error) {
      throw this.handleError(error, 'Error calculating client stats');
    }
  }

  /**
   * Obtener clientes por estado
   */
  async getByStatus(status: Client['status'], options: ClientQueryOptions = {}): Promise<Client[]> {
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
   * Construir query para clientes
   */
  private buildClientQuery(options: ClientQueryOptions): Record<string, string> {
    const query = buildDirectusQuery({
      filters: options.filters,
      search: options.search,
      limit: options.limit,
      offset: options.offset,
      page: options.page,
      sort: options.sort
    });

    // Incluir relaciones si se solicita
    if (options.includeRelations) {
      query.fields = '*,domains.*,invoices.*';
    }

    return query;
  }

  /**
   * Validaciones básicas
   */
  private validateClientData(data: CreateClientData): void {
    this.validateName(data.name);
    this.validateEmail(data.email);
    
    if (data.phone) {
      this.validatePhone(data.phone);
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Client name must be at least 2 characters');
    }
    
    if (name.length > 100) {
      throw new Error('Client name must be less than 100 characters');
    }
  }

  private validateEmail(email: string): void {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validatePhone(phone: string): void {
    if (phone && phone.length > 0) {
      // Validación básica de teléfono (ajustar según necesidades)
      const phoneRegex = /^[\+\-\s\(\)0-9]{7,20}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Invalid phone format');
      }
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