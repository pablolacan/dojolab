import React from 'react';
import Cookies from 'js-cookie';

/**
 * Utilidades para manejo de sesiones y actividad del usuario
 */

// Configuración de sesión desde .env
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000; // 30 min default
const REFRESH_BEFORE_EXPIRY = parseInt(import.meta.env.VITE_REFRESH_TOKEN_BEFORE_EXPIRY) || 300000; // 5 min default
const ACTIVITY_CHECK_INTERVAL = 60000; // 1 minuto

// Keys para localStorage y cookies
const STORAGE_KEYS = {
  LAST_ACTIVITY: 'portal_last_activity',
  SESSION_START: 'portal_session_start',
  USER_PREFERENCES: 'portal_user_prefs'
};

const COOKIE_KEYS = {
  SESSION_TOKEN: 'directus_session_token',
  REFRESH_TOKEN: 'directus_refresh_token'
};

/**
 * Obtener timestamp actual
 */
export const getCurrentTimestamp = (): number => Date.now();

/**
 * Actualizar última actividad del usuario
 */
export const updateLastActivity = (): void => {
  const timestamp = getCurrentTimestamp();
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, timestamp.toString());
  
  if (import.meta.env.VITE_APP_ENV === 'development') {
    console.log('🕐 Activity updated:', new Date(timestamp).toISOString());
  }
};

/**
 * Obtener última actividad registrada
 */
export const getLastActivity = (): number => {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  return stored ? parseInt(stored) : getCurrentTimestamp();
};

/**
 * Calcular tiempo transcurrido desde última actividad
 */
export const getTimeSinceLastActivity = (): number => {
  return getCurrentTimestamp() - getLastActivity();
};

/**
 * Verificar si la sesión ha expirado
 */
export const isSessionExpired = (): boolean => {
  const timeSinceActivity = getTimeSinceLastActivity();
  const expired = timeSinceActivity > SESSION_TIMEOUT;
  
  if (import.meta.env.VITE_APP_ENV === 'development' && expired) {
    console.log('⏰ Session expired:', {
      timeSinceActivity,
      sessionTimeout: SESSION_TIMEOUT,
      lastActivity: new Date(getLastActivity()).toISOString()
    });
  }
  
  return expired;
};

/**
 * Verificar si necesita refresh de token
 */
export const needsTokenRefresh = (): boolean => {
  const timeSinceActivity = getTimeSinceLastActivity();
  const timeUntilExpiry = SESSION_TIMEOUT - timeSinceActivity;
  const needsRefresh = timeUntilExpiry <= REFRESH_BEFORE_EXPIRY;
  
  if (import.meta.env.VITE_APP_ENV === 'development' && needsRefresh) {
    console.log('🔄 Token refresh needed:', {
      timeUntilExpiry,
      refreshThreshold: REFRESH_BEFORE_EXPIRY
    });
  }
  
  return needsRefresh;
};

/**
 * Inicializar nueva sesión
 */
export const initializeSession = (): void => {
  const timestamp = getCurrentTimestamp();
  localStorage.setItem(STORAGE_KEYS.SESSION_START, timestamp.toString());
  updateLastActivity();
  
  console.log('🚀 Session initialized:', new Date(timestamp).toISOString());
};

/**
 * Limpiar datos de sesión
 */
export const clearSession = (): void => {
  // Limpiar localStorage
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Limpiar cookies (Directus se encarga de esto, pero por si acaso)
  Object.values(COOKIE_KEYS).forEach(key => {
    Cookies.remove(key);
  });
  
  console.log('🧹 Session cleared');
};

/**
 * Obtener información de la sesión actual
 */
export const getSessionInfo = () => {
  const lastActivity = getLastActivity();
  const sessionStart = localStorage.getItem(STORAGE_KEYS.SESSION_START);
  const timeSinceActivity = getTimeSinceLastActivity();
  const timeUntilExpiry = SESSION_TIMEOUT - timeSinceActivity;
  
  return {
    lastActivity: new Date(lastActivity).toISOString(),
    sessionStart: sessionStart ? new Date(parseInt(sessionStart)).toISOString() : null,
    timeSinceActivity,
    timeUntilExpiry: Math.max(0, timeUntilExpiry),
    isExpired: isSessionExpired(),
    needsRefresh: needsTokenRefresh(),
    config: {
      sessionTimeout: SESSION_TIMEOUT,
      refreshThreshold: REFRESH_BEFORE_EXPIRY
    }
  };
};

/**
 * Hook para tracking de actividad automático
 */
export const useActivityTracker = () => {
  const [sessionInfo, setSessionInfo] = React.useState(getSessionInfo());
  
  React.useEffect(() => {
    // Eventos que consideramos como actividad
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Handler para actividad
    const handleActivity = () => {
      updateLastActivity();
    };
    
    // Throttle para evitar demasiadas actualizaciones
    let activityTimeout: number | null = null;
    const throttledActivityHandler = () => {
      if (activityTimeout) return;
      
      activityTimeout = setTimeout(() => {
        handleActivity();
        activityTimeout = null;
      }, 5000); // Actualizar máximo cada 5 segundos
    };
    
    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledActivityHandler, true);
    });
    
    // Interval para verificar estado de sesión
    const sessionCheckInterval = setInterval(() => {
      setSessionInfo(getSessionInfo());
    }, ACTIVITY_CHECK_INTERVAL);
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledActivityHandler, true);
      });
      
      clearInterval(sessionCheckInterval);
      
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, []);
  
  return sessionInfo;
};

/**
 * Hook para warnings de expiración
 */
export const useSessionWarnings = (onWarning?: () => void, onExpired?: () => void) => {
  const sessionInfo = useActivityTracker();
  const [warningShown, setWarningShown] = React.useState(false);
  
  React.useEffect(() => {
    const { timeUntilExpiry, isExpired } = sessionInfo;
    
    // Sesión expirada
    if (isExpired && onExpired) {
      onExpired();
      return;
    }
    
    // Warning 5 minutos antes de expirar
    const warningThreshold = 300000; // 5 minutos
    if (timeUntilExpiry <= warningThreshold && !warningShown && onWarning) {
      setWarningShown(true);
      onWarning();
    }
    
    // Reset warning si se renueva actividad
    if (timeUntilExpiry > warningThreshold && warningShown) {
      setWarningShown(false);
    }
    
  }, [sessionInfo, warningShown, onWarning, onExpired]);
  
  return sessionInfo;
};

/**
 * Guardar preferencias del usuario
 */
export const saveUserPreferences = (preferences: Record<string, any>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('❌ Failed to save user preferences:', error);
  }
};

/**
 * Obtener preferencias del usuario
 */
export const getUserPreferences = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('❌ Failed to load user preferences:', error);
    return {};
  }
};

// Export todo junto
export const session = {
  // Actividad
  updateActivity: updateLastActivity,
  getLastActivity,
  getTimeSinceActivity: getTimeSinceLastActivity,
  
  // Estado
  isExpired: isSessionExpired,
  needsRefresh: needsTokenRefresh,
  getInfo: getSessionInfo,
  
  // Ciclo de vida
  initialize: initializeSession,
  clear: clearSession,
  
  // Preferencias
  savePreferences: saveUserPreferences,
  getPreferences: getUserPreferences,
  
  // Hooks
  useTracker: useActivityTracker,
  useWarnings: useSessionWarnings
};