// src/utils/config.ts

import type { AppConfig } from '../types';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

/**
 * Parsear lista de IPs desde variable de entorno
 * Formato: "127.0.0.1,192.168.1.100,10.0.0.1"
 */
const parseAllowedIPs = (ipsString: string): string[] => {
  if (!ipsString || ipsString.trim() === '') {
    return [];
  }

  return ipsString
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)
    .filter(ip => {
      // Validación básica de formato IP
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      const isValid = ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'localhost' || ip === '127.0.0.1';
      
      if (!isValid) {
        console.warn(`⚠️ IP inválida ignorada: ${ip}`);
      }
      
      return isValid;
    });
};

export const config: AppConfig = {
  directusUrl: getEnvVar('VITE_DIRECTUS_URL'),
  appName: getEnvVar('VITE_APP_NAME', 'The Dojo Lab Dashboard'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  isDevelopment: getEnvVar('VITE_DEV_MODE', 'false') === 'true',
  maintenanceAllowedIPs: parseAllowedIPs(getEnvVar('VITE_MAINTENANCE_ALLOWED_IPS', '')),
};

// Validar configuración al inicio
const validateConfig = () => {
  if (!config.directusUrl) {
    throw new Error('VITE_DIRECTUS_URL is required');
  }

  if (!config.directusUrl.startsWith('http')) {
    throw new Error('VITE_DIRECTUS_URL must be a valid URL');
  }

};

validateConfig();