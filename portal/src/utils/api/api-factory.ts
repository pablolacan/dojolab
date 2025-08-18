// src/utils/api/api-factory.ts

import { TokenManager } from '../token-manager';
import { HttpClient } from '../http-client';
import { ErrorHandler } from './error-handler';

import { AuthService } from '../../services/api/auth-service';
import { UserService } from '../../services/api/user-service';
import { FileService } from '../../services/api/file-service';
import { HealthService } from '../../services/api/health-service';
import { MaintenanceService } from '../../services/api/maintenance-service';
import { SubscriptionApiService } from '../../services/api/subscription-service';
import { DomainService } from '../../services/api/domain-service';
import { ClientService } from '../../services/api/client-service';

import type { 
  AuthServiceConfig,
  FileServiceConfig,
  ServiceConfig
} from '../../services/api/types';

export interface ApiFactoryConfig {
  baseUrl: string;
  timeout?: number;
  enableRetry?: boolean;
  maxRetries?: number;
  enableLogging?: boolean;
  enableNotifications?: boolean;
  auth?: Partial<AuthServiceConfig>;
  file?: Partial<FileServiceConfig>;
}

export interface ApiServices {
  auth: AuthService;
  user: UserService;
  file: FileService;
  health: HealthService;
  maintenance: MaintenanceService;
  subscription: SubscriptionApiService;
  domain: DomainService;
  client: ClientService;
}

export interface ApiUtilities {
  tokenManager: TokenManager;
  httpClient: HttpClient;
  errorHandler: ErrorHandler;
}

export class ApiFactory {
  private config: ApiFactoryConfig;
  private services: ApiServices | null = null;
  private utilities: ApiUtilities | null = null;

  constructor(config: ApiFactoryConfig) {
    this.config = this.normalizeConfig(config);
  }

  /**
   * Crear todos los servicios de API
   */
  createServices(): ApiServices {
    if (this.services) {
      return this.services;
    }

    const utilities = this.createUtilities();
    
    // Configuraciones específicas por servicio
    const authConfig: AuthServiceConfig = {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      retries: this.config.maxRetries || 3,
      cache: false,
      debug: this.config.enableLogging || false,
      tokenRefreshBuffer: 5, // 5 minutos antes de expiración
      maxRefreshRetries: 3,
      ...this.config.auth
    };

    const fileConfig: FileServiceConfig = {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      retries: this.config.maxRetries || 3,
      cache: false,
      debug: this.config.enableLogging || false,
      maxFileSize: 50 * 1024 * 1024, // 50MB por defecto
      allowedTypes: [], // Sin restricciones por defecto
      defaultTransforms: {
        quality: 80,
        format: 'webp'
      },
      ...this.config.file
    };

    const serviceConfig: ServiceConfig = {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      retries: this.config.maxRetries || 3,
      cache: false,
      debug: this.config.enableLogging || false
    };

    // Crear servicios
    this.services = {
      auth: new AuthService(utilities.httpClient, utilities.tokenManager, authConfig),
      user: new UserService(utilities.httpClient),
      file: new FileService(utilities.httpClient, fileConfig),
      health: new HealthService(utilities.httpClient, serviceConfig),
      maintenance: new MaintenanceService(utilities.httpClient, serviceConfig),
      subscription: new SubscriptionApiService(utilities.httpClient),
      domain: new DomainService(utilities.httpClient),
      client: new ClientService(utilities.httpClient)
    };

    return this.services;
  }

  /**
   * Crear utilidades base
   */
  createUtilities(): ApiUtilities {
    if (this.utilities) {
      return this.utilities;
    }

    const tokenManager = new TokenManager();
    
    const httpClient = new HttpClient({
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout || 30000
    });

    const errorHandler = new ErrorHandler({
      enableLogging: this.config.enableLogging || false,
      enableRetry: this.config.enableRetry || true,
      maxRetries: this.config.maxRetries || 3,
      retryDelay: 1000,
      enableNotifications: this.config.enableNotifications || false,
      logLevel: this.config.enableLogging ? 'error' : 'warn'
    });

    this.utilities = {
      tokenManager,
      httpClient,
      errorHandler
    };

    return this.utilities;
  }

  /**
   * Obtener servicio específico
   */
  getService<K extends keyof ApiServices>(serviceName: K): ApiServices[K] {
    const services = this.createServices();
    return services[serviceName];
  }

  /**
   * Obtener utilidad específica
   */
  getUtility<K extends keyof ApiUtilities>(utilityName: K): ApiUtilities[K] {
    const utilities = this.createUtilities();
    return utilities[utilityName];
  }

  /**
   * Obtener todos los servicios
   */
  getAllServices(): ApiServices {
    return this.createServices();
  }

  /**
   * Obtener todas las utilidades
   */
  getAllUtilities(): ApiUtilities {
    return this.createUtilities();
  }

  /**
   * Configurar autenticación automática
   */
  configureAuthentication(): void {
    const { auth } = this.createServices();
    const { tokenManager, httpClient } = this.createUtilities();

    // Configurar token inicial si existe
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      httpClient.setDefaultHeader('Authorization', `Bearer ${accessToken}`);
    }

    // Iniciar auto-refresh de tokens
    if (auth instanceof AuthService) {
      auth.startTokenAutoRefresh();
    }
  }

  /**
   * Configurar manejo de errores global
   */
  configureErrorHandling(): void {
    const { errorHandler } = this.createUtilities();

    // Interceptar errores no manejados
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isApiError(event.reason)) {
        const handledError = errorHandler.handleError(event.reason, {
          service: 'global',
          operation: 'unhandled_rejection',
          timestamp: new Date()
        });
        
        console.error('Unhandled API error:', handledError);
        event.preventDefault();
      }
    });
  }

  /**
   * Configurar monitoreo de salud automático
   */
  configureHealthMonitoring(intervalMinutes: number = 10): void {
    const { health } = this.createServices();
    health.startHealthMonitoring(intervalMinutes);
  }

  /**
   * Configuración completa con valores por defecto
   */
  setupComplete(options: {
    enableAuth?: boolean;
    enableErrorHandling?: boolean;
    enableHealthMonitoring?: boolean;
    healthCheckInterval?: number;
  } = {}): ApiServices {
    const {
      enableAuth = true,
      enableErrorHandling = true,
      enableHealthMonitoring = false,
      healthCheckInterval = 10
    } = options;

    // Configurar autenticación
    if (enableAuth) {
      this.configureAuthentication();
    }

    // Configurar manejo de errores
    if (enableErrorHandling) {
      this.configureErrorHandling();
    }

    // Configurar monitoreo de salud
    if (enableHealthMonitoring) {
      this.configureHealthMonitoring(healthCheckInterval);
    }

    return this.createServices();
  }

  /**
   * Limpiar y destruir todos los servicios
   */
  destroy(): void {
    if (this.services) {
      // Limpiar health monitoring
      this.services.health.destroy();
      
      // Limpiar tokens
      this.services.auth.clearTokens();
    }

    if (this.utilities) {
      // Limpiar error history
      this.utilities.errorHandler.clearErrorHistory();
    }

    this.services = null;
    this.utilities = null;
  }

  /**
   * Obtener estadísticas de la API
   */
  getStats(): {
    errors: ReturnType<ErrorHandler['getErrorStats']>;
    health: any;
    auth: any;
  } {
    const { errorHandler } = this.createUtilities();
    const { health, auth } = this.createServices();

    return {
      errors: errorHandler.getErrorStats(),
      health: health.getLastHealthCheck(),
      auth: auth.getTokenStatus()
    };
  }

  /**
   * Verificar estado general de la API
   */
  async checkStatus(): Promise<{
    isHealthy: boolean;
    isAuthenticated: boolean;
    lastError?: string;
    uptime?: number;
  }> {
    const { health, auth } = this.createServices();
    const { errorHandler } = this.createUtilities();

    try {
      const [healthStatus, isAuthenticated] = await Promise.all([
        health.healthCheck(),
        Promise.resolve(auth.isAuthenticated())
      ]);

      const errorStats = errorHandler.getErrorStats();
      const lastError = errorStats.recentErrors[0]?.message;

      return {
        isHealthy: healthStatus.isHealthy,
        isAuthenticated,
        lastError,
        uptime: healthStatus.uptime
      };
    } catch (error) {
      return {
        isHealthy: false,
        isAuthenticated: auth.isAuthenticated(),
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Actualizar configuración de la factory
   */
  updateConfig(newConfig: Partial<ApiFactoryConfig>): void {
    this.config = this.normalizeConfig({ ...this.config, ...newConfig });
    
    // Recrear servicios con nueva configuración
    this.services = null;
    this.utilities = null;
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): ApiFactoryConfig {
    return { ...this.config };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Normalizar y validar configuración
   */
  private normalizeConfig(config: ApiFactoryConfig): ApiFactoryConfig {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }

    if (!config.baseUrl.startsWith('http')) {
      throw new Error('baseUrl must be a valid URL');
    }

    return {
      timeout: 30000,
      enableRetry: true,
      maxRetries: 3,
      enableLogging: false,
      enableNotifications: false,
      ...config
    };
  }

  /**
   * Verificar si un error es de API
   */
  private isApiError(error: any): boolean {
    return error && 
           typeof error === 'object' && 
           ('status' in error || 'code' in error || error.name?.includes('Error'));
  }
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Crear factory con configuración mínima
 */
export function createApiFactory(baseUrl: string, options: Partial<ApiFactoryConfig> = {}): ApiFactory {
  return new ApiFactory({
    baseUrl,
    ...options
  });
}

/**
 * Crear factory completamente configurada para producción
 */
export function createProductionApiFactory(baseUrl: string): ApiFactory {
  const factory = new ApiFactory({
    baseUrl,
    timeout: 30000,
    enableRetry: true,
    maxRetries: 3,
    enableLogging: true,
    enableNotifications: false
  });

  return factory;
}

/**
 * Crear factory para desarrollo con opciones debug
 */
export function createDevelopmentApiFactory(baseUrl: string): ApiFactory {
  const factory = new ApiFactory({
    baseUrl,
    timeout: 10000,
    enableRetry: true,
    maxRetries: 2,
    enableLogging: true,
    enableNotifications: true
  });

  return factory;
}