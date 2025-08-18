// src/utils/formatters/client-formatter.ts

import type { Client, ClientWithRelations, ClientStatus } from '../../types/client';
import type { BadgeVariant } from './subscription-formatter';

// ==================== TEXT MAPPINGS ====================

const STATUS_TEXTS: Record<string, string> = {
  'active': 'Activo',
  'inactive': 'Inactivo',
  'prospect': 'Prospecto'
};

// ==================== VARIANT MAPPINGS ====================

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  'active': 'success',
  'inactive': 'error',
  'prospect': 'warning'
};

const STATUS_COLORS: Record<string, string> = {
  'active': '#22c55e',
  'inactive': '#ef4444',
  'prospect': '#f59e0b'
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  'active': 'Cliente con servicios activos',
  'inactive': 'Cliente sin servicios activos',
  'prospect': 'Cliente potencial'
};

// ==================== BASIC FORMATTERS ====================

/**
 * Formatear estado a texto legible
 */
export function formatClientStatus(status: string): string {
  return STATUS_TEXTS[status] || status;
}

/**
 * Obtener variante de badge para estado
 */
export function getClientStatusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] || 'neutral';
}

/**
 * Obtener color para estado
 */
export function getClientStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6B7280';
}

/**
 * Obtener información completa del estado
 */
export function getClientStatusInfo(status: string): ClientStatus {
  return {
    value: status as 'active' | 'inactive' | 'prospect',
    label: formatClientStatus(status),
    color: getClientStatusColor(status),
    description: STATUS_DESCRIPTIONS[status] || ''
  };
}

// ==================== NAME & CONTACT FORMATTERS ====================

/**
 * Formatear nombre completo del cliente
 */
export function formatClientName(client: Client): string {
  return client.name?.trim() || 'Cliente sin nombre';
}

/**
 * Formatear nombre para display con email
 */
export function formatClientDisplayName(client: Client): string {
  const name = formatClientName(client);
  return `${name} (${client.email})`;
}

/**
 * Formatear iniciales del cliente para avatares
 */
export function getClientInitials(client: Client): string {
  const name = client.name?.trim() || '';
  
  if (!name) {
    return client.email?.substring(0, 2).toUpperCase() || 'CL';
  }
  
  const words = name.split(' ').filter(word => word.length > 0);
  
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return 'CL';
}

/**
 * Formatear teléfono con formato legible
 */
export function formatClientPhone(phone?: string): string {
  if (!phone || phone.trim() === '') return 'No disponible';
  
  // Limpiar el teléfono de caracteres especiales
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatear según longitud (asumiendo números guatemaltecos)
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('502')) {
    return `+502 ${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone; // Devolver original si no coincide con patrones
}

/**
 * Formatear email con validación visual
 */
export function formatClientEmail(email: string): {
  email: string;
  isValid: boolean;
  domain: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  const domain = email.includes('@') ? email.split('@')[1] : '';
  
  return {
    email,
    isValid,
    domain
  };
}

// ==================== WEBSITE FORMATTERS ====================

/**
 * Formatear URL de website
 */
export function formatWebsiteUrl(url: string): string {
  if (!url) return '';
  
  // Agregar protocolo si no lo tiene
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Obtener dominio de una URL
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const formattedUrl = formatWebsiteUrl(url);
    const urlObj = new URL(formattedUrl);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Formatear lista de websites del cliente
 */
export function formatClientWebsites(client: Client): Array<{
  url: string;
  formattedUrl: string;
  domain: string;
  description?: string;
  isPrimary: boolean;
}> {
  if (!client.websites || client.websites.length === 0) return [];
  
  return client.websites.map(website => ({
    url: website.url,
    formattedUrl: formatWebsiteUrl(website.url),
    domain: extractDomainFromUrl(website.url),
    description: website.description,
    isPrimary: website.is_primary || false
  }));
}

// ==================== DATE FORMATTERS ====================

/**
 * Formatear fecha de creación del cliente
 */
export function formatClientCreatedDate(dateString: string, options: {
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
 * Formatear fecha relativa (hace X días)
 */
export function formatClientRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  } catch (error) {
    return dateString;
  }
}

// ==================== CLIENT SPECIFIC FORMATTERS ====================

/**
 * Formatear cliente completo para display
 */
export function formatClientForDisplay(client: Client): {
  name: string;
  displayName: string;
  initials: string;
  status: string;
  statusVariant: BadgeVariant;
  statusColor: string;
  email: ReturnType<typeof formatClientEmail>;
  phone: string;
  websites: ReturnType<typeof formatClientWebsites>;
  createdDate: string;
  relativeDate: string;
  isActive: boolean;
} {
  return {
    name: formatClientName(client),
    displayName: formatClientDisplayName(client),
    initials: getClientInitials(client),
    status: formatClientStatus(client.status),
    statusVariant: getClientStatusVariant(client.status),
    statusColor: getClientStatusColor(client.status),
    email: formatClientEmail(client.email),
    phone: formatClientPhone(client.phone),
    websites: formatClientWebsites(client),
    createdDate: formatClientCreatedDate(client.date_created),
    relativeDate: formatClientRelativeDate(client.date_created),
    isActive: client.status === 'active'
  };
}

/**
 * Formatear cliente con relaciones para vista detallada
 */
export function formatClientWithRelations(client: ClientWithRelations): {
  client: ReturnType<typeof formatClientForDisplay>;
  domainCount: number;
  invoiceCount: number;
  totalRevenue: string;
  lastActivity: string;
  hasActivity: boolean;
} {
  const formattedClient = formatClientForDisplay(client);
  
  return {
    client: formattedClient,
    domainCount: client.domainCount || 0,
    invoiceCount: client.invoiceCount || 0,
    totalRevenue: formatCurrency(client.totalRevenue || 0),
    lastActivity: client.lastActivity ? formatClientRelativeDate(client.lastActivity) : 'Sin actividad',
    hasActivity: !!(client.domainCount || client.invoiceCount)
  };
}

// ==================== STATISTICS FORMATTERS ====================

/**
 * Formatear estadísticas de clientes
 */
export function formatClientStats(stats: {
  total: number;
  active: number;
  inactive: number;
  prospect: number;
  totalDomains: number;
  totalInvoices: number;
  totalRevenue: number;
  averageDomainsPerClient: number;
}): {
  totalFormatted: string;
  activePercentage: string;
  totalRevenueFormatted: string;
  averageDomainsFormatted: string;
  statusBreakdown: Array<{ status: string; count: number; percentage: string; color: string }>;
} {
  const { total } = stats;
  
  const statusBreakdown = [
    { key: 'active', count: stats.active },
    { key: 'prospect', count: stats.prospect },
    { key: 'inactive', count: stats.inactive }
  ].map(item => ({
    status: formatClientStatus(item.key),
    count: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) + '%' : '0%',
    color: getClientStatusColor(item.key)
  }));
  
  return {
    totalFormatted: total.toLocaleString(),
    activePercentage: total > 0 ? ((stats.active / total) * 100).toFixed(1) + '%' : '0%',
    totalRevenueFormatted: formatCurrency(stats.totalRevenue),
    averageDomainsFormatted: stats.averageDomainsPerClient.toFixed(1),
    statusBreakdown
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Formatear moneda (reutilizar desde subscription-formatter)
 */
function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  } catch {
    return `Q${amount.toFixed(2)}`;
  }
}

// ==================== FORM OPTIONS ====================

/**
 * Obtener opciones para formularios
 */
export function getClientFormOptions() {
  return {
    statuses: Object.entries(STATUS_TEXTS).map(([value, label]) => ({ 
      value, 
      label,
      color: STATUS_COLORS[value],
      description: STATUS_DESCRIPTIONS[value]
    }))
  };
}

// ==================== SEARCH HELPERS ====================

/**
 * Crear texto de búsqueda para un cliente
 */
export function createClientSearchText(client: Client): string {
  const websites = client.websites?.map(w => w.url).join(' ') || '';
  
  return [
    client.name,
    client.email,
    client.phone || '',
    formatClientStatus(client.status),
    websites,
    client.notes || '',
    client.id.toString()
  ].join(' ').toLowerCase();
}

/**
 * Formatear filtros activos para display
 */
export function formatActiveClientFilters(filters: Record<string, any>): Array<{ key: string; label: string; value: string }> {
  const formatted: Array<{ key: string; label: string; value: string }> = [];
  
  if (filters.status) {
    formatted.push({
      key: 'status',
      label: 'Estado',
      value: formatClientStatus(filters.status)
    });
  }
  
  if (filters.name) {
    formatted.push({
      key: 'name',
      label: 'Nombre',
      value: filters.name
    });
  }
  
  if (filters.email) {
    formatted.push({
      key: 'email',
      label: 'Email',
      value: filters.email
    });
  }
  
  if (filters.has_domains) {
    formatted.push({
      key: 'has_domains',
      label: 'Con dominios',
      value: filters.has_domains ? 'Sí' : 'No'
    });
  }
  
  return formatted;
}