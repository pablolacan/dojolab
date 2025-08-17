// src/services/api/maintenance-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { MaintenanceModeData } from '../../types';
import type { 
  MaintenanceStatus, 
  MaintenanceUpdateData,
  ServiceConfig 
} from './types';
import { API_ENDPOINTS } from './endpoints';

export class MaintenanceService {
  private httpClient: HttpClient;
  private config: ServiceConfig;
  private cache: { 
    data: MaintenanceModeData | null; 
    timestamp: number;
    userIP?: string;
  } = {
    data: null,
    timestamp: 0
  };
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  constructor(httpClient: HttpClient, config: ServiceConfig) {
    this.httpClient = httpClient;
    this.config = config;
  }

  /**
   * Obtener datos de mantenimiento desde la API
   */
  async getMaintenanceData(forceRefresh = false): Promise<MaintenanceModeData> {
    const now = Date.now();
    
    // Verificar cache
    if (!forceRefresh && 
        this.cache.data && 
        (now - this.cache.timestamp) < this.cacheTimeout) {
      return this.cache.data;
    }

    try {
      const response = await this.httpClient.get<{ data: MaintenanceModeData }>(
        API_ENDPOINTS.MAINTENANCE.BASE
      );
      
      // Actualizar cache
      this.cache = {
        data: response.data,
        timestamp: now,
        userIP: this.cache.userIP
      };
      
      return response.data;
    } catch (error) {
      // Si hay cache disponible, usarlo como fallback
      if (this.cache.data) {
        return this.cache.data;
      }
      
      // Fallback por defecto
      return this.getDefaultMaintenanceData();
    }
  }

  /**
   * Actualizar configuración de mantenimiento
   */
  async updateMaintenanceMode(data: MaintenanceUpdateData): Promise<MaintenanceModeData> {
    try {
      // Validar datos antes de actualizar
      this.validateMaintenanceData(data);
      
      const updateData = {
        ...data,
        date_updated: new Date().toISOString()
      };

      const response = await this.httpClient.patch<{ data: MaintenanceModeData }>(
        API_ENDPOINTS.MAINTENANCE.BASE,
        updateData
      );

      // Limpiar cache después de actualizar
      this.clearCache();
      
      return response.data;
    } catch (error) {
      throw this.handleMaintenanceError(error, 'Error updating maintenance mode');
    }
  }

  /**
   * Activar modo mantenimiento
   */
  async enableMaintenanceMode(options: {
    title?: string;
    message?: string;
    estimatedTime?: string;
  } = {}): Promise<MaintenanceModeData> {
    return this.updateMaintenanceMode({
      is_active: true,
      title: options.title || 'Sitio en Mantenimiento',
      message: options.message || 'Estamos trabajando en mejorar tu experiencia.',
      estimated_time: options.estimatedTime || 'Volveremos pronto'
    });
  }

  /**
   * Desactivar modo mantenimiento
   */
  async disableMaintenanceMode(): Promise<MaintenanceModeData> {
    return this.updateMaintenanceMode({
      is_active: false
    });
  }

  /**
   * Obtener IP del usuario
   */
  private async getUserIP(): Promise<string> {
    // Si ya está en cache, usarla
    if (this.cache.userIP) {
      return this.cache.userIP;
    }

    try {
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://ip.seeip.org/jsonip'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, { 
            signal: AbortSignal.timeout(3000)
          });
          
          if (!response.ok) continue;
          
          const data = await response.json();
          const ip = data.ip || data.query || data.ip_address;
          
          if (ip && this.isValidIP(ip)) {
            this.cache.userIP = ip;
            return ip;
          }
        } catch {
          continue;
        }
      }

      // Fallback para desarrollo
      if (this.config.debug) {
        this.cache.userIP = '127.0.0.1';
        return '127.0.0.1';
      }

      throw new Error('No se pudo obtener la IP del usuario');
    } catch (error) {
      this.cache.userIP = 'unknown';
      return 'unknown';
    }
  }

  /**
   * Verificar si una IP está en la lista de permitidas
   */
  private isIPAllowed(userIP: string, allowedIPs: string[]): boolean {
    if (!allowedIPs || allowedIPs.length === 0) {
      return false;
    }

    return allowedIPs.includes(userIP);
  }

  /**
   * Validar formato de IP
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'localhost';
  }

  /**
   * Obtener estado completo del mantenimiento
   */
  async getMaintenanceStatus(
    allowedIPs: string[] = [], 
    forceRefresh = false
  ): Promise<MaintenanceStatus> {
    try {
      const [maintenanceData, userIP] = await Promise.all([
        this.getMaintenanceData(forceRefresh),
        this.getUserIP()
      ]);

      const isAllowedIP = this.isIPAllowed(userIP, allowedIPs);
      const shouldShowMaintenance = maintenanceData.is_active && !isAllowedIP;

      return {
        isActive: maintenanceData.is_active,
        data: maintenanceData,
        isAllowedIP,
        shouldShowMaintenance,
        userIP
      };
    } catch (error) {
      // Fallback con cache si está disponible
      if (this.cache.data && this.cache.userIP) {
        const isAllowedIP = this.isIPAllowed(this.cache.userIP, allowedIPs);
        
        return {
          isActive: this.cache.data.is_active,
          data: this.cache.data,
          isAllowedIP,
          shouldShowMaintenance: this.cache.data.is_active && !isAllowedIP,
          userIP: this.cache.userIP
        };
      }
      
      // Fallback seguro
      return {
        isActive: false,
        data: this.getDefaultMaintenanceData(),
        isAllowedIP: false,
        shouldShowMaintenance: false,
        userIP: 'unknown'
      };
    }
  }

  /**
   * Verificar solo si el mantenimiento está activo
   */
  async isMaintenanceActive(forceRefresh = false): Promise<boolean> {
    try {
      const data = await this.getMaintenanceData(forceRefresh);
      return data.is_active;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar si se debe mostrar la página de mantenimiento
   */
  async shouldShowMaintenancePage(
    allowedIPs: string[] = [], 
    forceRefresh = false
  ): Promise<boolean> {
    const status = await this.getMaintenanceStatus(allowedIPs, forceRefresh);
    return status.shouldShowMaintenance;
  }

  /**
   * Obtener información de debug del mantenimiento
   */
  async getDebugInfo(allowedIPs: string[] = []): Promise<{
    userIP: string;
    allowedIPs: string[];
    isAllowed: boolean;
    cacheAge: number;
    maintenanceData: MaintenanceModeData | null;
  }> {
    const userIP = await this.getUserIP();
    const isAllowed = this.isIPAllowed(userIP, allowedIPs);
    const cacheAge = this.cache.timestamp ? Date.now() - this.cache.timestamp : 0;

    return {
      userIP,
      allowedIPs,
      isAllowed,
      cacheAge,
      maintenanceData: this.cache.data
    };
  }

  /**
   * Programar activación de mantenimiento
   */
  async scheduleMaintenanceMode(
    activateAt: Date,
    options: {
      title?: string;
      message?: string;
      estimatedTime?: string;
    } = {}
  ): Promise<void> {
    const now = new Date();
    const delay = activateAt.getTime() - now.getTime();

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    setTimeout(async () => {
      try {
        await this.enableMaintenanceMode(options);
        console.log('Maintenance mode activated automatically');
      } catch (error) {
        console.error('Failed to activate scheduled maintenance mode:', error);
      }
    }, delay);
  }

  /**
   * Programar desactivación de mantenimiento
   */
  async scheduleMaintenanceEnd(deactivateAt: Date): Promise<void> {
    const now = new Date();
    const delay = deactivateAt.getTime() - now.getTime();

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    setTimeout(async () => {
      try {
        await this.disableMaintenanceMode();
        console.log('Maintenance mode deactivated automatically');
      } catch (error) {
        console.error('Failed to deactivate scheduled maintenance mode:', error);
      }
    }, delay);
  }

  /**
   * Limpiar cache de mantenimiento
   */
  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  /**
   * Obtener edad del cache en minutos
   */
  getCacheAge(): number {
    if (!this.cache.timestamp) return 0;
    return Math.floor((Date.now() - this.cache.timestamp) / 60000);
  }

  /**
   * Datos por defecto para mantenimiento
   */
  private getDefaultMaintenanceData(): MaintenanceModeData {
    return {
      id: 1,
      status: 'published',
      user_updated: null,
      title: 'Sitio en Mantenimiento',
      message: 'Estamos trabajando en mejorar tu experiencia.',
      estimated_time: 'Volveremos pronto',
      contact_email: 'hola@thedojolab.com',
      is_active: false,
      show_contact_email: true
    };
  }

  /**
   * Manejo centralizado de errores de mantenimiento
   */
  private handleMaintenanceError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Validar datos de actualización
   */
  private validateMaintenanceData(data: MaintenanceUpdateData): void {
    const errors: string[] = [];

    if (data.title && data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (data.message && data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    }

    if (data.contact_email && !this.isValidEmail(data.contact_email)) {
      errors.push('Invalid email format');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Validar formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtener estadísticas de mantenimiento
   */
  async getMaintenanceStats(): Promise<{
    isActive: boolean;
    lastUpdated: string | null;
    cacheAge: number;
    userIP: string;
    estimatedTime: string;
  }> {
    const data = await this.getMaintenanceData();
    const userIP = await this.getUserIP();

    return {
      isActive: data.is_active,
      lastUpdated: data.user_updated,
      cacheAge: this.getCacheAge(),
      userIP,
      estimatedTime: data.estimated_time
    };
  }
}