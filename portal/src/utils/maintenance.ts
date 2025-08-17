// src/utils/maintenance.ts

import { getApiClient } from './api-client';
import { config } from './config';
import type { MaintenanceModeData } from '../types';

interface MaintenanceStatus {
  isActive: boolean;
  data: MaintenanceModeData | null;
  isAllowedIP: boolean;
  shouldShowMaintenance: boolean;
  userIP?: string;
}

class MaintenanceService {
  private cache: { 
    data: MaintenanceModeData | null; 
    timestamp: number;
    userIP?: string;
  } = {
    data: null,
    timestamp: 0
  };
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtener la IP del usuario usando un servicio externo
   */
  private async getUserIP(): Promise<string> {
    try {
      // Usar múltiples servicios como fallback
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://ip.seeip.org/jsonip'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, { 
            timeout: 3000 
          } as any);
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          // Diferentes servicios devuelven la IP en diferentes campos
          const ip = data.ip || data.query || data.ip_address;
          
          if (ip && this.isValidIP(ip)) {
            console.log(`🌐 IP obtenida desde ${service}:`, ip);
            return ip;
          }
        } catch (error) {
          console.warn(`⚠️ Error obteniendo IP desde ${service}:`, error);
          continue;
        }
      }

      // Fallback: IP local para desarrollo
      if (config.isDevelopment) {
        console.log('🏠 Usando IP local para desarrollo');
        return '127.0.0.1';
      }

      throw new Error('No se pudo obtener la IP del usuario');
    } catch (error) {
      console.error('❌ Error obteniendo IP:', error);
      // En caso de error, asumir que NO está en la lista permitida
      return 'unknown';
    }
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
   * Verificar si la IP está en la lista de permitidas
   */
  private isIPAllowed(userIP: string): boolean {
    const allowedIPs = config.maintenanceAllowedIPs;
    
    if (!allowedIPs || allowedIPs.length === 0) {
      console.log('📝 No hay IPs permitidas configuradas');
      return false;
    }

    // Verificar coincidencia exacta
    const isAllowed = allowedIPs.includes(userIP);
    
    console.log('🔍 Verificación de IP:', {
      userIP,
      allowedIPs,
      isAllowed
    });

    return isAllowed;
  }

  /**
   * Obtener el estado completo del modo mantenimiento
   */
  async getMaintenanceStatus(forceRefresh = false): Promise<MaintenanceStatus> {
    const now = Date.now();
    
    // Verificar cache
    if (!forceRefresh && 
        this.cache.data && 
        this.cache.userIP &&
        (now - this.cache.timestamp) < this.cacheTimeout) {
      
      const isAllowedIP = this.isIPAllowed(this.cache.userIP);
      
      return {
        isActive: this.cache.data.is_active,
        data: this.cache.data,
        isAllowedIP,
        shouldShowMaintenance: this.cache.data.is_active && !isAllowedIP,
        userIP: this.cache.userIP
      };
    }

    try {
      // Obtener datos en paralelo
      const [maintenanceData, userIP] = await Promise.all([
        this.fetchMaintenanceData(),
        this.getUserIP()
      ]);

      // Actualizar cache
      this.cache = {
        data: maintenanceData,
        timestamp: now,
        userIP
      };

      const isAllowedIP = this.isIPAllowed(userIP);
      const shouldShowMaintenance = maintenanceData.is_active && !isAllowedIP;

      console.log('🔧 Estado de mantenimiento:', {
        isActive: maintenanceData.is_active,
        userIP,
        isAllowedIP,
        shouldShowMaintenance
      });

      return {
        isActive: maintenanceData.is_active,
        data: maintenanceData,
        isAllowedIP,
        shouldShowMaintenance,
        userIP
      };

    } catch (error) {
      console.error('❌ Error obteniendo estado de mantenimiento:', error);
      
      // Fallback con cache si está disponible
      if (this.cache.data && this.cache.userIP) {
        console.warn('⚠️ Usando cache como fallback');
        const isAllowedIP = this.isIPAllowed(this.cache.userIP);
        
        return {
          isActive: this.cache.data.is_active,
          data: this.cache.data,
          isAllowedIP,
          shouldShowMaintenance: this.cache.data.is_active && !isAllowedIP,
          userIP: this.cache.userIP
        };
      }
      
      // Fallback por defecto - modo seguro
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
   * Obtener solo los datos de mantenimiento desde Directus
   */
  private async fetchMaintenanceData(): Promise<MaintenanceModeData> {
    try {
      const apiClient = getApiClient();
      return await apiClient.getMaintenanceMode();
    } catch (error) {
      console.error('❌ Error obteniendo datos de mantenimiento:', error);
      throw error;
    }
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
   * Métodos de conveniencia para compatibilidad con código existente
   */
  async getMaintenanceMode(forceRefresh = false): Promise<MaintenanceModeData> {
    const status = await this.getMaintenanceStatus(forceRefresh);
    return status.data || this.getDefaultMaintenanceData();
  }

  async isMaintenanceActive(forceRefresh = false): Promise<boolean> {
    const status = await this.getMaintenanceStatus(forceRefresh);
    return status.isActive;
  }

  async shouldShowMaintenanceMode(forceRefresh = false): Promise<boolean> {
    const status = await this.getMaintenanceStatus(forceRefresh);
    return status.shouldShowMaintenance;
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  /**
   * Obtener información de debug
   */
  async getDebugInfo(): Promise<{
    userIP: string;
    allowedIPs: string[];
    isAllowed: boolean;
    cacheAge: number;
  }> {
    const userIP = await this.getUserIP();
    const allowedIPs = config.maintenanceAllowedIPs;
    const isAllowed = this.isIPAllowed(userIP);
    const cacheAge = this.cache.timestamp ? Date.now() - this.cache.timestamp : 0;

    return {
      userIP,
      allowedIPs,
      isAllowed,
      cacheAge
    };
  }
}

// Singleton instance
const maintenanceService = new MaintenanceService();

export { maintenanceService };

// Funciones de conveniencia (mantener compatibilidad)
export const getMaintenanceMode = (forceRefresh = false) => 
  maintenanceService.getMaintenanceMode(forceRefresh);

export const isMaintenanceActive = (forceRefresh = false) => 
  maintenanceService.isMaintenanceActive(forceRefresh);

export const shouldShowMaintenanceMode = (forceRefresh = false) => 
  maintenanceService.shouldShowMaintenanceMode(forceRefresh);

export const getMaintenanceStatus = (forceRefresh = false) => 
  maintenanceService.getMaintenanceStatus(forceRefresh);

export const clearMaintenanceCache = () => 
  maintenanceService.clearCache();

export const getMaintenanceDebugInfo = () => 
  maintenanceService.getDebugInfo();