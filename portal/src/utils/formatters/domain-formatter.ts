// src/utils/formatters/domain-formatter.ts

import type { Domain } from '../../types/domain';
import type { BadgeVariant } from './subscription-formatter';

// ==================== TEXT MAPPINGS ====================

const STATUS_TEXTS: Record<string, string> = {
  'active': 'Activo',
  'expired': 'Expirado', 
  'pending_transfer': 'Transferencia Pendiente'
};

// ==================== VARIANT MAPPINGS ====================

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  'active': 'success',
  'expired': 'error',
  'pending_transfer': 'warning'
};

const STATUS_COLORS: Record<string, string> = {
  'active': '#22c55e',
  'expired': '#ef4444',
  'pending_transfer': '#f59e0b'
};

// ==================== BASIC FORMATTERS ====================

/**
 * Formatear estado a texto legible
 */
export function formatDomainStatus(status: string): string {
  return STATUS_TEXTS[status] || status;
}

/**
 * Obtener variante de badge para estado
 */
export function getDomainStatusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] || 'neutral';
}

/**
 * Obtener color para estado
 */
export function getDomainStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6B7280';
}

// ==================== PRICE FORMATTERS ====================

/**
 * Formatear precio de renovación
 */
export function formatDomainPrice(price: string | number, options: {
  currency?: string;
  locale?: string;
  showFree?: boolean;
} = {}): string {
  const {
    currency = 'USD',
    locale = 'es-ES',
    showFree = true
  } = options;

  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(num)) return '$0.00';
  
  if (num === 0 && showFree) return 'Gratis';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (error) {
    return `$${num.toFixed(2)}`;
  }
}

// ==================== DATE FORMATTERS ====================

/**
 * Formatear fecha de expiración
 */
export function formatExpirationDate(dateString: string, options: {
  locale?: string;
  style?: 'short' | 'medium' | 'long';
} = {}): string {
  const {
    locale = 'es-ES',
    style = 'medium'
  } = options;

  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      short: { day: 'numeric' as const, month: 'short' as const, year: 'numeric' as const },
      medium: { day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const },
      long: { weekday: 'long' as const, day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const }
    }[style];

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  } catch (error) {
    return dateString;
  }
}

/**
 * Obtener estado de expiración con días restantes
 */
export function getExpirationStatus(dateString: string): {
  status: 'expired' | 'critical' | 'warning' | 'ok';
  daysUntil: number;
  color: string;
  message: string;
} {
  try {
    const expirationDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    const diffInMs = expirationDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { 
        status: 'expired', 
        daysUntil, 
        color: '#ef4444',
        message: `Expiró hace ${Math.abs(daysUntil)} días`
      };
    } else if (daysUntil === 0) {
      return { 
        status: 'critical', 
        daysUntil, 
        color: '#dc2626',
        message: 'Expira hoy'
      };
    } else if (daysUntil <= 7) {
      return { 
        status: 'critical', 
        daysUntil, 
        color: '#dc2626',
        message: `Expira en ${daysUntil} días`
      };
    } else if (daysUntil <= 30) {
      return { 
        status: 'warning', 
        daysUntil, 
        color: '#f59e0b',
        message: `Expira en ${daysUntil} días`
      };
    } else {
      return { 
        status: 'ok', 
        daysUntil, 
        color: '#22c55e',
        message: `Expira en ${daysUntil} días`
      };
    }
  } catch (error) {
    return { 
      status: 'ok', 
      daysUntil: 0, 
      color: '#6B7280',
      message: 'Fecha inválida'
    };
  }
}

// ==================== DOMAIN SPECIFIC FORMATTERS ====================

/**
 * Formatear dominio completo para display
 */
export function formatDomainForDisplay(domain: Domain): {
  name: string;
  status: string;
  statusVariant: BadgeVariant;
  statusColor: string;
  price: string;
  expirationDate: string;
  expirationStatus: ReturnType<typeof getExpirationStatus>;
  clientName: string;
  providerName: string;
  isActive: boolean;
} {
  return {
    name: domain.domain_,
    status: formatDomainStatus(domain.status),
    statusVariant: getDomainStatusVariant(domain.status),
    statusColor: getDomainStatusColor(domain.status),
    price: formatDomainPrice(domain.renewal_price),
    expirationDate: formatExpirationDate(domain.expiration_date),
    expirationStatus: getExpirationStatus(domain.expiration_date),
    clientName: typeof domain.client_id === 'object' ? domain.client_id.name : 'Cliente desconocido',
    providerName: typeof domain.provider_id === 'object' ? domain.provider_id.name : 'Proveedor desconocido',
    isActive: domain.status === 'active'
  };
}

// ==================== STATISTICS FORMATTERS ====================

/**
 * Formatear estadísticas de dominios
 */
export function formatDomainStats(stats: {
  total: number;
  active: number;
  expired: number;
  pending_transfer: number;
  totalCost: number;
  averageCost: number;
  expiringIn30Days: number;
  expiringIn7Days: number;
}): {
  totalFormatted: string;
  activePercentage: string;
  totalCostFormatted: string;
  averageCostFormatted: string;
  statusBreakdown: Array<{ status: string; count: number; percentage: string; color: string }>;
  expirationAlerts: { critical: number; warning: number };
} {
  const { total } = stats;
  
  const statusBreakdown = [
    { key: 'active', count: stats.active },
    { key: 'expired', count: stats.expired },
    { key: 'pending_transfer', count: stats.pending_transfer }
  ].map(item => ({
    status: formatDomainStatus(item.key),
    count: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) + '%' : '0%',
    color: getDomainStatusColor(item.key)
  }));
  
  return {
    totalFormatted: total.toLocaleString(),
    activePercentage: total > 0 ? ((stats.active / total) * 100).toFixed(1) + '%' : '0%',
    totalCostFormatted: formatDomainPrice(stats.totalCost),
    averageCostFormatted: formatDomainPrice(stats.averageCost),
    statusBreakdown,
    expirationAlerts: {
      critical: stats.expiringIn7Days,
      warning: stats.expiringIn30Days
    }
  };
}

// ==================== FORM OPTIONS ====================

/**
 * Obtener opciones para formularios
 */
export function getDomainFormOptions() {
  return {
    statuses: Object.entries(STATUS_TEXTS).map(([value, label]) => ({ value, label }))
  };
}

// ==================== SEARCH HELPERS ====================

/**
 * Crear texto de búsqueda para un dominio
 */
export function createDomainSearchText(domain: Domain): string {
  return [
    domain.domain_,
    formatDomainStatus(domain.status),
    typeof domain.client_id === 'object' ? domain.client_id.name : '',
    typeof domain.provider_id === 'object' ? domain.provider_id.name : '',
    domain.dns_provider || '',
    domain.id.toString()
  ].join(' ').toLowerCase();
}