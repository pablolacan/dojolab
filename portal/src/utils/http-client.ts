// src/utils/http-client.ts

import type { ApiError } from '../types';

export interface HttpClientOptions {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  timeout?: number;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private timeout: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders
    };
    this.timeout = options.timeout || 30000;
  }

  /**
   * Construir headers finales para la request
   */
  private buildHeaders(additionalHeaders?: HeadersInit): HeadersInit {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders
    };
  }

  /**
   * Construir URL completa
   */
  private buildUrl(endpoint: string): string {
    // Asegurar que el endpoint empiece con /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Crear AbortController con timeout
   */
  private createAbortController(timeout?: number): AbortController {
    const controller = new AbortController();
    const timeoutMs = timeout || this.timeout;
    
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    
    return controller;
  }

  /**
   * Manejar respuesta y errores
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.errors?.[0]?.message || errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje HTTP
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status
      };
      
      throw error;
    }

    // Manejar respuestas vacías (como DELETE)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Realizar request HTTP genérica
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeout, ...fetchOptions } = options;
    const controller = this.createAbortController(timeout);
    
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options.headers);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * Actualizar header por defecto (útil para auth token)
   */
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      [key]: value
    };
  }

  /**
   * Remover header por defecto
   */
  removeDefaultHeader(key: string): void {
    const headers = { ...this.defaultHeaders };
    delete (headers as any)[key];
    this.defaultHeaders = headers;
  }

  /**
   * Actualizar base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtener base URL actual
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}