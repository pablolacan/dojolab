// src/hooks/useMaintenance.ts

import { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../utils/maintenance';
import type { MaintenanceModeData } from '../types';

interface UseMaintenanceReturn {
  maintenanceData: MaintenanceModeData | null;
  isActive: boolean;
  shouldShowMaintenance: boolean;
  isAllowedIP: boolean;
  userIP?: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  debugInfo: () => Promise<any>;
}

export const useMaintenance = (
  checkInterval: number = 10 * 60 * 1000, // Verificar cada 10 minutos (reducido)
  enablePolling: boolean = false // Deshabilitado por defecto
): UseMaintenanceReturn => {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceModeData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [shouldShowMaintenance, setShouldShowMaintenance] = useState(false);
  const [isAllowedIP, setIsAllowedIP] = useState(false);
  const [userIP, setUserIP] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenanceStatus = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) setLoading(true);
      
      const status = await maintenanceService.getMaintenanceStatus(forceRefresh);
      
      setMaintenanceData(status.data);
      setIsActive(status.isActive);
      setShouldShowMaintenance(status.shouldShowMaintenance);
      setIsAllowedIP(status.isAllowedIP);
      setUserIP(status.userIP);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading maintenance mode');
      console.error('Error en useMaintenance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchMaintenanceStatus(true);
  }, [fetchMaintenanceStatus]);

  // Polling interval solo si está habilitado
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(() => {
      fetchMaintenanceStatus(false);
    }, checkInterval);

    return () => clearInterval(interval);
  }, [fetchMaintenanceStatus, checkInterval, enablePolling]);

  // Refetch manual
  const refetch = useCallback(() => {
    fetchMaintenanceStatus(true);
  }, [fetchMaintenanceStatus]);

  // Función de debug
  const debugInfo = useCallback(async () => {
    try {
      const debug = await maintenanceService.getDebugInfo();
      console.table(debug);
      return debug;
    } catch (error) {
      console.error('Error obteniendo debug info:', error);
      return null;
    }
  }, []);

  // Escuchar cuando el usuario regresa a la pestaña (solo si hay polling)
  useEffect(() => {
    if (!enablePolling) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMaintenanceStatus(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMaintenanceStatus, enablePolling]);

  // Escuchar cambios de conexión (opcional)
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        fetchMaintenanceStatus(true);
      }
    };

    const handleOffline = () => {
      setError('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchMaintenanceStatus]);

  return {
    maintenanceData,
    isActive,
    shouldShowMaintenance,
    isAllowedIP,
    userIP,
    loading,
    error,
    refetch,
    debugInfo,
  };
};