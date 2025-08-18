// src/utils/api-client.ts

import type {
  DirectusFile,
  MaintenanceModeData,
  LoginCredentials,
  AuthTokens,
  DirectusUser,
  Subscription,
  Domain,
  Client,
  Provider,
  CreateDomainData,
  UpdateDomainData
} from '../types';

import { createApiFactory } from './api/api-factory';
import type { ApiFactory } from './api/api-factory';
import type { ApiServices } from './api/api-factory';

/**
 * LEGACY API CLIENT - Mantiene compatibilidad con código existente
 * 
 * Este cliente actúa como un wrapper/proxy hacia los nuevos servicios especializados.
 * Mantiene la interfaz original para evitar breaking changes mientras internamente
 * usa la nueva arquitectura modular.
 * 
 * @deprecated Use ApiFactory and specialized services directly for new code
 */
class ApiClient {
  private apiFactory: ApiFactory;
  private services: ApiServices;

  constructor(baseUrl: string) {
    this.apiFactory = createApiFactory(baseUrl, {
      enableLogging: true,
      enableRetry: true,
      maxRetries: 3
    });
    
    // Configurar todo automáticamente
    this.services = this.apiFactory.setupComplete({
      enableAuth: true,
      enableErrorHandling: true,
      enableHealthMonitoring: false
    });
  }

  // ==================== AUTH METHODS (LEGACY) ====================

  async login(credentials: LoginCredentials): Promise<{ user: DirectusUser; tokens: AuthTokens }> {
    return this.services.auth.login(credentials);
  }

  async logout(): Promise<void> {
    return this.services.auth.logout();
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    return this.services.auth.refreshAccessToken();
  }

  async getCurrentUser(): Promise<DirectusUser> {
    return this.services.auth.getCurrentUser();
  }

  isAuthenticated(): boolean {
    return this.services.auth.isAuthenticated();
  }

  hasStoredTokens(): boolean {
    return this.services.auth.hasStoredTokens();
  }

  getAccessToken(): string | null {
    return this.apiFactory.getUtility('tokenManager').getAccessToken();
  }

  getTokenTimeRemaining(): number {
    return this.apiFactory.getUtility('tokenManager').getTokenTimeRemaining();
  }

  clearTokens(): void {
    return this.services.auth.clearTokens();
  }

  getTokenStatus() {
    return this.services.auth.getTokenStatus();
  }

  reloadTokens(): void {
    return this.services.auth.reloadTokens();
  }

  // ==================== FILE METHODS (LEGACY) ====================

  async getFile(fileId: string): Promise<DirectusFile> {
    return this.services.file.getFile(fileId);
  }

  getAssetUrl(fileId: string): string {
    return this.services.file.getAssetUrl(fileId);
  }

  getAssetUrlWithTransform(
    fileId: string, 
    params: Record<string, string | number> = {}
  ): string {
    return this.services.file.getAssetUrlWithTransform(fileId, params);
  }

  // ==================== MAINTENANCE METHODS (LEGACY) ====================

  async getMaintenanceMode(): Promise<MaintenanceModeData> {
    return this.services.maintenance.getMaintenanceData();
  }

  // ==================== HEALTH METHODS (LEGACY) ====================

  async ping(): Promise<{ status: string }> {
    const result = await this.services.health.ping();
    return { status: result.success ? 'ok' : 'error' };
  }

  // ==================== SUBSCRIPTION METHODS (LEGACY) ====================

  async getSubscriptions(): Promise<Subscription[]> {
    // Usar el servicio de subscription de la factory
    const response = await this.services.subscription.getAll();
    return response.data;
  }

  async getSubscription(id: number): Promise<Subscription> {
    return this.services.subscription.getById(id);
  }

  // ==================== DOMAIN METHODS (LEGACY) ====================

  /**
   * Obtener todos los dominios
   */
  async getDomains(): Promise<Domain[]> {
    const response = await this.services.domain.getAll();
    return response.data;
  }

  /**
   * Obtener dominio por ID
   */
  async getDomain(id: number): Promise<Domain> {
    return this.services.domain.getById(id);
  }

  /**
   * Crear dominio
   */
  async createDomain(data: CreateDomainData): Promise<Domain> {
    return this.services.domain.create(data);
  }

  /**
   * Actualizar dominio
   */
  async updateDomain(id: number, data: UpdateDomainData): Promise<Domain> {
    return this.services.domain.update(id, data);
  }

  /**
   * Eliminar dominio
   */
  async deleteDomain(id: number): Promise<void> {
    return this.services.domain.delete(id);
  }

  /**
   * Obtener clientes para dropdown
   */
  async getClientsForDomains(): Promise<Client[]> {
    return this.services.domain.getClients();
  }

  /**
   * Obtener proveedores para dropdown
   */
  async getProvidersForDomains(): Promise<Provider[]> {
    return this.services.domain.getProviders();
  }

  // ==================== GENERIC REQUEST METHOD (LEGACY) ====================

  /**
   * Método genérico para hacer requests - mantiene compatibilidad
   * Internamente usa el nuevo HttpClient con manejo de auth automático
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const httpClient = this.apiFactory.getUtility('httpClient');
    const authService = this.services.auth;

    try {
      // Asegurar token válido para endpoints que no sean públicos
      const isPublicEndpoint = this.isPublicEndpoint(endpoint);
      if (!isPublicEndpoint) {
        await authService.ensureValidToken();
      }

      return await httpClient.request<T>(endpoint, options);
    } catch (error) {
      // Manejar error con el nuevo sistema
      const errorHandler = this.apiFactory.getUtility('errorHandler');
      const handledError = errorHandler.handleError(error, {
        service: 'legacy-client',
        operation: 'request',
        endpoint,
        timestamp: new Date()
      });
      
      throw handledError;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Verificar si un endpoint es público (no requiere autenticación)
   */
  private isPublicEndpoint(endpoint: string): boolean {
    const publicEndpoints = [
      '/auth/',
      '/items/maintenance_mode',
      '/server/ping',
      '/server/health'
    ];
    
    return publicEndpoints.some(publicPath => endpoint.startsWith(publicPath));
  }

  /**
   * Obtener estadísticas de la API
   */
  getApiStats() {
    return this.apiFactory.getStats();
  }

  /**
   * Verificar estado general
   */
  async checkApiStatus() {
    return this.apiFactory.checkStatus();
  }

  /**
   * Acceso directo a servicios especializados (para migración gradual)
   */
  getAuthService() {
    return this.services.auth;
  }

  getUserService() {
    return this.services.user;
  }

  getFileService() {
    return this.services.file;
  }

  getHealthService() {
    return this.services.health;
  }

  getMaintenanceService() {
    return this.services.maintenance;
  }

  getSubscriptionService() {
    return this.services.subscription;
  }

  getDomainService() {
    return this.services.domain;
  }

  /**
   * Acceso directo a la factory (para casos avanzados)
   */
  getApiFactory(): ApiFactory {
    return this.apiFactory;
  }

  /**
   * Destruir cliente y limpiar recursos
   */
  destroy(): void {
    this.apiFactory.destroy();
  }
}

// ==================== SINGLETON PATTERN (LEGACY COMPATIBILITY) ====================

let apiClient: ApiClient | null = null;

export const createApiClient = (baseUrl: string): ApiClient => {
  if (!apiClient) {
    apiClient = new ApiClient(baseUrl);
  }
  return apiClient;
};

export const getApiClient = (): ApiClient => {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient first.');
  }
  return apiClient;
};

// ==================== MIGRATION HELPERS ====================

/**
 * Helper para obtener servicios directamente (nueva forma recomendada)
 */
export const getApiServices = (): ApiServices => {
  const client = getApiClient();
  return {
    auth: client.getAuthService(),
    user: client.getUserService(),
    file: client.getFileService(),
    health: client.getHealthService(),
    maintenance: client.getMaintenanceService(),
    subscription: client.getSubscriptionService(),
    domain: client.getDomainService()
  };
};

/**
 * Helper para crear factory independiente (recomendado para nuevo código)
 */
export const createApiServices = (baseUrl: string): ApiServices => {
  const factory = createApiFactory(baseUrl);
  return factory.setupComplete();
};

// Exportar clase para compatibilidad
export { ApiClient };