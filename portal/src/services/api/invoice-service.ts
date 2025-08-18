// src/services/api/invoice-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { 
  Invoice, 
  CreateInvoiceData, 
  UpdateInvoiceData, 
  InvoiceFilters, 
  InvoiceStats,
  InvoiceWithRelations,
  InvoiceOption,
  InvoiceFinancialSummary} from '../../types/invoice';
import type { PaginatedResponse, QueryOptions } from './types';
import { buildDirectusQuery, buildUrlWithParams } from './endpoints';

// Endpoints específicos para invoices
const INVOICE_ENDPOINTS = {
  BASE: '/items/invoices',
  BY_ID: (id: number) => `/items/invoices/${id}`,
  WITH_RELATIONS: (id: number) => `/items/invoices/${id}?fields=*,client_id.*,invoice_file.*`,
  SEARCH: '/items/invoices',
  OPTIONS: '/items/invoices?fields=id,invoice_number,amount,status,client_id.name',
  BY_CLIENT: (clientId: number) => `/items/invoices?filter[client_id][_eq]=${clientId}`,
  FINANCIAL_SUMMARY: '/items/invoices?aggregate[sum]=amount&aggregate[count]=*'
} as const;

export interface InvoiceQueryOptions extends QueryOptions {
  filters?: InvoiceFilters;
  includeRelations?: boolean;
  includeFile?: boolean;
}

export class InvoiceService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Obtener todas las facturas con filtros y paginación
   */
  async getAll(options: InvoiceQueryOptions = {}): Promise<PaginatedResponse<Invoice>> {
    try {
      const queryParams = this.buildInvoiceQuery(options);
      const endpoint = buildUrlWithParams(INVOICE_ENDPOINTS.BASE, queryParams);
      
      const response = await this.httpClient.get<PaginatedResponse<Invoice>>(endpoint);
      
      return {
        data: response.data,
        meta: response.meta || { 
          total_count: response.data.length, 
          filter_count: response.data.length 
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Error fetching invoices');
    }
  }

  /**
   * Obtener factura por ID
   */
  async getById(id: string | number): Promise<Invoice> {
    try {
      const response = await this.httpClient.get<{ data: Invoice }>(
        INVOICE_ENDPOINTS.BY_ID(Number(id))
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error fetching invoice ${id}`);
    }
  }

  /**
   * Obtener factura con relaciones (cliente, archivo)
   */
  async getByIdWithRelations(id: string | number): Promise<InvoiceWithRelations> {
    try {
      const response = await this.httpClient.get<{ data: InvoiceWithRelations }>(
        INVOICE_ENDPOINTS.WITH_RELATIONS(Number(id))
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error fetching invoice ${id} with relations`);
    }
  }

  /**
   * Crear nueva factura
   */
  async create(data: CreateInvoiceData): Promise<Invoice> {
    try {
      // Validación básica
      this.validateInvoiceData(data);

      const invoiceData = {
        ...data,
        status: data.status || 'draft',
        date_created: new Date().toISOString(),
      };

      const response = await this.httpClient.post<{ data: Invoice }>(
        INVOICE_ENDPOINTS.BASE,
        invoiceData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error creating invoice');
    }
  }

  /**
   * Actualizar factura
   */
  async update(id: string | number, data: UpdateInvoiceData): Promise<Invoice> {
    try {
      // Validación básica para actualización
      if (data.invoice_number) this.validateInvoiceNumber(data.invoice_number);
      if (data.amount) this.validateAmount(data.amount);
      if (data.invoice_date) this.validateInvoiceDate(data.invoice_date);

      const updateData = {
        ...data,
        date_updated: new Date().toISOString(),
      };

      const response = await this.httpClient.patch<{ data: Invoice }>(
        INVOICE_ENDPOINTS.BY_ID(Number(id)),
        updateData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error updating invoice ${id}`);
    }
  }

  /**
   * Eliminar factura
   */
  async delete(id: string | number): Promise<void> {
    try {
      await this.httpClient.delete(INVOICE_ENDPOINTS.BY_ID(Number(id)));
    } catch (error) {
      throw this.handleError(error, `Error deleting invoice ${id}`);
    }
  }

  /**
   * Cambiar estado de la factura
   */
  async changeStatus(id: number, status: Invoice['status']): Promise<Invoice> {
    return this.update(id, { status });
  }

  /**
   * Marcar factura como pagada
   */
  async markAsPaid(id: number): Promise<Invoice> {
    return this.changeStatus(id, 'paid');
  }

  /**
   * Marcar factura como enviada
   */
  async markAsSent(id: number): Promise<Invoice> {
    return this.changeStatus(id, 'sent');
  }

  /**
   * Buscar facturas por término
   */
  async search(searchTerm: string, options: InvoiceQueryOptions = {}): Promise<Invoice[]> {
    try {
      const searchOptions = {
        ...options,
        search: searchTerm,
        limit: options.limit || 50
      };

      const response = await this.getAll(searchOptions);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error searching invoices');
    }
  }

  /**
   * Obtener facturas para dropdown/select
   */
  async getOptions(): Promise<InvoiceOption[]> {
    try {
      const response = await this.httpClient.get<{ data: InvoiceOption[] }>(
        INVOICE_ENDPOINTS.OPTIONS
      );
      
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error fetching invoice options');
    }
  }

  /**
   * Obtener facturas por cliente
   */
  async getByClient(clientId: number, options: InvoiceQueryOptions = {}): Promise<Invoice[]> {
    try {
      const searchOptions = {
        ...options,
        filters: {
          ...options.filters,
          client_id: clientId
        }
      };

      const response = await this.getAll(searchOptions);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Error fetching invoices for client ${clientId}`);
    }
  }

  /**
   * Verificar si número de factura ya existe
   */
  async checkInvoiceNumberExists(invoiceNumber: string, excludeId?: number): Promise<boolean> {
    try {
      const filters: Record<string, any> = { invoice_number: invoiceNumber };
      
      if (excludeId) {
        filters['id[_neq]'] = excludeId;
      }

      const queryParams = buildDirectusQuery({
        filters,
        limit: 1,
        fields: ['id']
      });

      const endpoint = buildUrlWithParams(INVOICE_ENDPOINTS.BASE, queryParams);
      const response = await this.httpClient.get<PaginatedResponse<{ id: number }>>(endpoint);
      
      return response.data.length > 0;
    } catch (error) {
      throw this.handleError(error, 'Error checking invoice number availability');
    }
  }

  /**
   * Obtener estadísticas de facturas
   */
  async getStats(): Promise<InvoiceStats> {
    try {
      const response = await this.getAll({ limit: -1 });
      const invoices = response.data;
      
      const stats: InvoiceStats = {
        total: invoices.length,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        averageAmount: 0,
        averagePaymentTime: 0
      };

      let totalPaymentDays = 0;
      let paidInvoicesCount = 0;

      invoices.forEach(invoice => {
        // Contar por estado
        stats[invoice.status]++;
        
        const amount = parseFloat(invoice.amount || '0');
        stats.totalAmount += amount;

        if (invoice.status === 'paid') {
          stats.paidAmount += amount;
          
          // Calcular días de pago (simplificado)
          const invoiceDate = new Date(invoice.invoice_date);
          const updatedDate = new Date(invoice.date_updated || invoice.date_created);
          const paymentDays = Math.floor((updatedDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          
          totalPaymentDays += paymentDays;
          paidInvoicesCount++;
        } else if (invoice.status === 'overdue') {
          stats.overdueAmount += amount;
        } else if (invoice.status === 'sent') {
          stats.pendingAmount += amount;
        }
      });

      // Calcular promedios
      stats.averageAmount = invoices.length > 0 ? stats.totalAmount / invoices.length : 0;
      stats.averagePaymentTime = paidInvoicesCount > 0 ? totalPaymentDays / paidInvoicesCount : 0;

      return stats;
    } catch (error) {
      throw this.handleError(error, 'Error calculating invoice stats');
    }
  }

  /**
   * Obtener resumen financiero
   */
  async getFinancialSummary(): Promise<InvoiceFinancialSummary> {
    try {
      const stats = await this.getStats();
      
      const summary: InvoiceFinancialSummary = {
        totalInvoiced: stats.totalAmount,
        totalPaid: stats.paidAmount,
        totalPending: stats.pendingAmount,
        totalOverdue: stats.overdueAmount,
        paymentRate: stats.total > 0 ? (stats.paid / stats.total) * 100 : 0,
        averageDaysToPayment: stats.averagePaymentTime,
        monthlyRecurring: 0, // Requerirá lógica adicional
        projectedRevenue: stats.pendingAmount + stats.overdueAmount
      };

      return summary;
    } catch (error) {
      throw this.handleError(error, 'Error calculating financial summary');
    }
  }

  /**
   * Obtener facturas próximas a vencer
   */
  async getOverdue(): Promise<Invoice[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const options: InvoiceQueryOptions = {
        filters: {
          status: 'sent',
          date_to: today
        },
        sort: ['invoice_date']
      };

      const response = await this.getAll(options);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error fetching overdue invoices');
    }
  }

  /**
   * Generar número de factura automático
   */
  async generateInvoiceNumber(prefix: string = 'INV'): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Buscar el último número de factura del mes
      const searchPattern = `${prefix}-${year}-${month}`;
      
      const response = await this.httpClient.get<{ data: Invoice[] }>(
        buildUrlWithParams(INVOICE_ENDPOINTS.BASE, {
          'filter[invoice_number][_starts_with]': searchPattern,
          'sort': '-invoice_number',
          'limit': '1',
          'fields': 'invoice_number'
        })
      );

      let nextNumber = 1;
      
      if (response.data.length > 0) {
        const lastInvoiceNumber = response.data[0].invoice_number;
        const lastNumberMatch = lastInvoiceNumber.match(/(\d+)$/);
        if (lastNumberMatch) {
          nextNumber = parseInt(lastNumberMatch[1]) + 1;
        }
      }

      return `${prefix}-${year}-${month}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      throw this.handleError(error, 'Error generating invoice number');
    }
  }

  /**
   * Obtener facturas por estado
   */
  async getByStatus(status: Invoice['status'], options: InvoiceQueryOptions = {}): Promise<Invoice[]> {
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
   * Construir query para facturas
   */
  private buildInvoiceQuery(options: InvoiceQueryOptions): Record<string, string> {
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
      query.fields = '*,client_id.*';
    }

    if (options.includeFile) {
      query.fields = query.fields ? `${query.fields},invoice_file.*` : '*,invoice_file.*';
    }

    return query;
  }

  /**
   * Validaciones básicas
   */
  private validateInvoiceData(data: CreateInvoiceData): void {
    this.validateInvoiceNumber(data.invoice_number);
    this.validateAmount(data.amount);
    this.validateInvoiceDate(data.invoice_date);
    
    if (!data.client_id) throw new Error('Client is required');
  }

  private validateInvoiceNumber(invoiceNumber: string): void {
    if (!invoiceNumber || invoiceNumber.trim().length < 3) {
      throw new Error('Invoice number must be at least 3 characters');
    }
    
    if (invoiceNumber.length > 50) {
      throw new Error('Invoice number must be less than 50 characters');
    }
  }

  private validateAmount(amount: string): void {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < 0) {
      throw new Error('Amount must be a valid positive number');
    }
    
    if (numAmount > 999999999.99) {
      throw new Error('Amount is too large');
    }
  }

  private validateInvoiceDate(date: string): void {
    const invoiceDate = new Date(date);
    
    if (isNaN(invoiceDate.getTime())) {
      throw new Error('Invalid invoice date');
    }
    
    // La fecha de factura puede ser pasada, presente o futura
    // No hay restricciones específicas aquí
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