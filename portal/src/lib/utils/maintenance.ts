import React from 'react';

/**
 * Utilidades para modo mantenimiento y control de acceso por IP
 */

/**
 * Verificar si el modo mantenimiento está activo
 */
export const isMaintenanceMode = (): boolean => {
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE;
  return maintenanceMode === 'true' || maintenanceMode === true;
};

/**
 * Obtener lista de IPs permitidas desde el .env
 */
export const getAllowedIPs = (): string[] => {
  const allowedIPs = import.meta.env.VITE_ALLOWED_IPS;
  
  if (!allowedIPs) {
    console.warn('⚠️ No VITE_ALLOWED_IPS configured');
    return [];
  }
  
  return allowedIPs
    .split(',')
    .map((ip: string) => ip.trim())
    .filter((ip: string) => ip.length > 0);
};

/**
 * Verificar si una IP está en la lista de permitidas
 */
export const isAllowedIP = (userIP: string): boolean => {
  if (!userIP) {
    console.warn('⚠️ No IP provided for validation');
    return false;
  }
  
  const allowedIPs = getAllowedIPs();
  const normalizedUserIP = userIP.trim();
  
  // Verificar coincidencia exacta
  const isAllowed = allowedIPs.includes(normalizedUserIP);
  
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.log('🔍 IP Check:', {
      userIP: normalizedUserIP,
      allowedIPs,
      isAllowed
    });
  }
  
  return isAllowed;
};

/**
 * Verificar si se puede acceder durante mantenimiento
 */
export const canAccessDuringMaintenance = (userIP?: string): boolean => {
  // Si no hay modo mantenimiento, acceso libre
  if (!isMaintenanceMode()) {
    return true;
  }
  
  // Si hay modo mantenimiento pero no hay IP, denegar acceso
  if (!userIP) {
    console.log('🚫 Maintenance mode active, no IP provided');
    return false;
  }
  
  const hasAccess = isAllowedIP(userIP);
  
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.log('🔧 Maintenance access check:', {
      maintenanceMode: true,
      userIP,
      hasAccess
    });
  }
  
  return hasAccess;
};

/**
 * Obtener IP del cliente (lado cliente, limitado)
 * Nota: En producción, esto debe manejarse desde el servidor
 */
export const getClientIP = async (): Promise<string | null> => {
  try {
    // Método simple usando servicio externo
    // En producción, es mejor obtener la IP desde headers del servidor
    const response = await fetch('https://api.ipify.org?format=json');
    
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get client IP:', error);
    return null;
  }
};

/**
 * Verificar acceso completo (mantenimiento + IP)
 */
export const checkMaintenanceAccess = async (): Promise<{
  canAccess: boolean;
  reason?: string;
  userIP?: string;
}> => {
  // Si no hay modo mantenimiento, acceso libre
  if (!isMaintenanceMode()) {
    return { canAccess: true };
  }
  
  try {
    // Obtener IP del cliente
    const userIP = await getClientIP();
    
    if (!userIP) {
      return {
        canAccess: false,
        reason: 'Unable to verify IP address during maintenance',
      };
    }
    
    const canAccess = isAllowedIP(userIP);
    
    return {
      canAccess,
      userIP,
      reason: canAccess 
        ? undefined 
        : 'IP address not authorized during maintenance'
    };
    
  } catch (error) {
    console.error('❌ Maintenance access check failed:', error);
    return {
      canAccess: false,
      reason: 'Maintenance access verification failed'
    };
  }
};

/**
 * Hook para componentes React
 */
export const useMaintenanceCheck = () => {
  const [status, setStatus] = React.useState<{
    loading: boolean;
    canAccess: boolean;
    reason?: string;
    userIP?: string;
  }>({
    loading: true,
    canAccess: true
  });
  
  React.useEffect(() => {
    checkMaintenanceAccess().then(result => {
      setStatus({
        loading: false,
        ...result
      });
    });
  }, []);
  
  return status;
};

/**
 * Configuración de mantenimiento para debugging
 */
export const getMaintenanceConfig = () => {
  return {
    isActive: isMaintenanceMode(),
    allowedIPs: getAllowedIPs(),
    environment: import.meta.env.VITE_APP_ENV,
    directusUrl: import.meta.env.VITE_DIRECTUS_URL
  };
};

// Export todo junto
export const maintenance = {
  isActive: isMaintenanceMode,
  getAllowedIPs,
  isAllowedIP,
  canAccessDuringMaintenance,
  getClientIP,
  checkAccess: checkMaintenanceAccess,
  getConfig: getMaintenanceConfig
};