// src/services/api/health-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { 
  HealthCheckResponse, 
  SystemInfoResponse,
  ServiceConfig 
} from './types';
import { API_ENDPOINTS } from './endpoints';

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  uptime: number;
  responseTime: number;
  services: {
    api: boolean;
    database: boolean;
    redis?: boolean;
  };
}

export interface ConnectionTest {
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

export class HealthService {
  private httpClient: HttpClient;
  private config: ServiceConfig;
  private lastHealthCheck: HealthStatus | null = null;
  private healthCheckInterval: number | null = null;

  constructor(httpClient: HttpClient, config: ServiceConfig) {
    this.httpClient = httpClient;
    this.config = config;
  }

  /**
   * Ping básico al servidor
   */
  async ping(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.get<{ status: string }>(
        API_ENDPOINTS.SYSTEM.PING,
        { timeout: 5000 }
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.status === 'ok',
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Health check completo del sistema
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient.get<HealthCheckResponse>(
        API_ENDPOINTS.SYSTEM.HEALTH || '/server/health',
        { timeout: 10000 }
      );
      
      const responseTime = Date.now() - startTime;
      const now = new Date();
      
      const healthStatus: HealthStatus = {
        isHealthy: response.status === 'ok',
        lastCheck: now,
        uptime: response.uptime || 0,
        responseTime,
        services: {
          api: response.status === 'ok',
          database: response.database?.status === 'connected' || response.status === 'ok',
          redis: response.redis?.status === 'connected'
        }
      };
      
      this.lastHealthCheck = healthStatus;
      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Intentar ping básico como fallback
      const pingResult = await this.ping();
      
      const healthStatus: HealthStatus = {
        isHealthy: pingResult.success,
        lastCheck: new Date(),
        uptime: 0,
        responseTime,
        services: {
          api: pingResult.success,
          database: false,
          redis: false
        }
      };
      
      this.lastHealthCheck = healthStatus;
      return healthStatus;
    }
  }

  /**
   * Obtener información del sistema
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    try {
      const response = await this.httpClient.get<SystemInfoResponse>(
        API_ENDPOINTS.SYSTEM.INFO || '/server/info',
        { timeout: 5000 }
      );
      
      return response;
    } catch (error) {
      throw this.handleHealthError(error, 'Error fetching system info');
    }
  }

  /**
   * Verificar conectividad específica a la base de datos
   */
  async checkDatabaseConnection(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Intentar una query simple que debe funcionar si la DB está conectada
      await this.httpClient.get('/server/ping', { timeout: 5000 });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date()
      };
    }
  }

  /**
   * Test de latencia múltiple para obtener promedio
   */
  async testLatency(samples: number = 5): Promise<{
    min: number;
    max: number;
    average: number;
    samples: number[];
  }> {
    const results: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      try {
        const test = await this.ping();
        results.push(test.responseTime);
        
        // Pequeña pausa entre tests
        if (i < samples - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        // En caso de error, agregar un tiempo alto como penalización
        results.push(10000);
      }
    }
    
    return {
      min: Math.min(...results),
      max: Math.max(...results),
      average: Math.round(results.reduce((a, b) => a + b, 0) / results.length),
      samples: results
    };
  }

  /**
   * Verificación de endpoints críticos
   */
  async checkCriticalEndpoints(): Promise<Record<string, ConnectionTest>> {
    const criticalEndpoints = [
      { name: 'ping', endpoint: API_ENDPOINTS.SYSTEM.PING },
      { name: 'auth', endpoint: '/auth/refresh' }, // Solo para verificar que existe
      { name: 'users', endpoint: '/users/me' }, // Requerirá auth pero debe dar 401, no 404
    ];

    const results: Record<string, ConnectionTest> = {};
    
    for (const { name, endpoint } of criticalEndpoints) {
      const startTime = Date.now();
      
      try {
        await this.httpClient.get(endpoint, { timeout: 3000 });
        
        results[name] = {
          success: true,
          responseTime: Date.now() - startTime,
          timestamp: new Date()
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // Para algunos endpoints, un 401 es esperado y significa que están funcionando
        const isExpectedError = (error as any)?.status === 401 && name === 'users';
        
        results[name] = {
          success: isExpectedError,
          responseTime,
          error: isExpectedError ? undefined : (error instanceof Error ? error.message : 'Unknown error'),
          timestamp: new Date()
        };
      }
    }
    
    return results;
  }

  /**
   * Obtener el último health check realizado
   */
  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Iniciar monitoreo automático de salud
   */
  startHealthMonitoring(intervalMinutes: number = 5): void {
    // Detener monitoreo previo si existe
    this.stopHealthMonitoring();
    
    // Realizar check inicial
    this.healthCheck().catch(error => {
      console.warn('Initial health check failed:', error);
    });
    
    // Configurar intervalo
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
        
        if (this.config.debug) {
          console.log('Health check completed:', this.lastHealthCheck);
        }
      } catch (error) {
        console.warn('Scheduled health check failed:', error);
      }
    }, intervalMinutes * 60 * 1000) as any;
  }

  /**
   * Detener monitoreo automático
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const ping = await this.ping();
      return ping.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener estadísticas de rendimiento
   */
  async getPerformanceStats(): Promise<{
    latency: { min: number; max: number; average: number };
    uptime: number;
    lastCheck: Date | null;
    isHealthy: boolean;
  }> {
    const latencyTest = await this.testLatency(3);
    const health = this.lastHealthCheck || await this.healthCheck();
    
    return {
      latency: {
        min: latencyTest.min,
        max: latencyTest.max,
        average: latencyTest.average
      },
      uptime: health.uptime,
      lastCheck: health.lastCheck,
      isHealthy: health.isHealthy
    };
  }

  /**
   * Manejo centralizado de errores de health
   */
  private handleHealthError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Cleanup al destruir el servicio
   */
  destroy(): void {
    this.stopHealthMonitoring();
  }

  /**
   * Formatear tiempo de respuesta para display
   */
  static formatResponseTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  }

  /**
   * Determinar el estado de salud basado en métricas
   */
  static getHealthLevel(health: HealthStatus): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!health.isHealthy) return 'poor';
    
    if (health.responseTime < 200 && health.services.api && health.services.database) {
      return 'excellent';
    } else if (health.responseTime < 500 && health.services.api) {
      return 'good';
    } else if (health.responseTime < 1000) {
      return 'fair';
    } else {
      return 'poor';
    }
  }
}