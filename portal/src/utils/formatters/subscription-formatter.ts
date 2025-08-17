// src/utils/formatters/subscription-formatter.ts

import type { Subscription } from '../../types';

// ==================== TEXT MAPPINGS ====================

const STATUS_TEXTS: Record<string, string> = {
  'pending': 'Pendiente',
  'active': 'Activo',
  'cancelled': 'Cancelado',
  'expired': 'Expirado',
  'trialing': 'Prueba'
};

const PLAN_TYPE_TEXTS: Record<string, string> = {
  'free': 'Gratis',
  'paid': 'Paga'
};

const BILLING_CYCLE_TEXTS: Record<string, string> = {
  'monthly': 'Mensual',
  'yearly': 'Anual',
  'one_time': 'Único',
  'none': 'Gratis'
};

// ==================== VARIANT MAPPINGS FOR UI ====================

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  'active': 'success',
  'pending': 'warning',
  'cancelled': 'error',
  'expired': 'error',
  'trialing': 'info'
};

const PLAN_TYPE_VARIANTS: Record<string, BadgeVariant> = {
  'paid': 'info',
  'free': 'neutral'
};

// ==================== COLOR MAPPINGS ====================

const STATUS_COLORS: Record<string, string> = {
  'pending': '#5568C3',
  'active': '#89E557',
  'cancelled': '#E27E7E',
  'expired': '#E93F3F',
  'trialing': '#94F3FF'
};

// ==================== BASIC FORMATTERS ====================

/**
 * Formatear estado a texto legible
 */
export function formatStatus(status: string): string {
  return STATUS_TEXTS[status] || status;
}

/**
 * Formatear tipo de plan a texto legible
 */
export function formatPlanType(planType: string): string {
  return PLAN_TYPE_TEXTS[planType] || planType;
}

/**
 * Formatear ciclo de facturación a texto legible
 */
export function formatBillingCycle(billingCycle: string): string {
  return BILLING_CYCLE_TEXTS[billingCycle] || billingCycle;
}

/**
 * Obtener variante de badge para estado
 */
export function getStatusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] || 'neutral';
}

/**
 * Obtener variante de badge para tipo de plan
 */
export function getPlanTypeVariant(planType: string): BadgeVariant {
  return PLAN_TYPE_VARIANTS[planType] || 'neutral';
}

/**
 * Obtener color para estado
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6B7280';
}

// ==================== CURRENCY FORMATTERS ====================

/**
 * Formatear costo como moneda
 */
export function formatCurrency(amount: string | number, options: {
  currency?: string;
  locale?: string;
  showFree?: boolean;
} = {}): string {
  const {
    currency = 'USD',
    locale = 'es-ES',
    showFree = true
  } = options;

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
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
    // Fallback if Intl is not supported or invalid locale/currency
    return `$${num.toFixed(2)}`;
  }
}

/**
 * Formatear costo simple (solo número con símbolo)
 */
export function formatCurrencySimple(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '$0.00';
  if (num === 0) return 'Gratis';
  
  return `$${num.toFixed(2)}`;
}

/**
 * Formatear costo compacto (K, M para miles y millones)
 */
export function formatCurrencyCompact(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '$0';
  if (num === 0) return 'Gratis';
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
}

// ==================== DATE FORMATTERS ====================

/**
 * Formatear fecha de renovación
 */
export function formatRenewalDate(dateString: string, options: {
  locale?: string;
  style?: 'short' | 'medium' | 'long' | 'full';
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
      long: { weekday: 'long' as const, day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const },
      full: { weekday: 'long' as const, day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const }
    }[style];

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  } catch (error) {
    return dateString; // Fallback to original string
  }
}

/**
 * Formatear fecha relativa (hace X días, en X días)
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Mañana';
    if (diffInDays === -1) return 'Ayer';
    if (diffInDays > 0) return `En ${diffInDays} días`;
    if (diffInDays < 0) return `Hace ${Math.abs(diffInDays)} días`;
    
    return formatRenewalDate(dateString, { style: 'short' });
  } catch (error) {
    return dateString;
  }
}

/**
 * Determinar estado de la fecha de renovación
 */
export function getRenewalStatus(dateString: string): {
  status: 'expired' | 'due_soon' | 'due_today' | 'upcoming';
  daysUntil: number;
  color: string;
} {
  try {
    const renewalDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);
    
    const diffInMs = renewalDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { status: 'expired', daysUntil, color: '#E93F3F' };
    } else if (daysUntil === 0) {
      return { status: 'due_today', daysUntil, color: '#FF6B35' };
    } else if (daysUntil <= 7) {
      return { status: 'due_soon', daysUntil, color: '#FFA500' };
    } else {
      return { status: 'upcoming', daysUntil, color: '#89E557' };
    }
  } catch (error) {
    return { status: 'upcoming', daysUntil: 0, color: '#6B7280' };
  }
}

// ==================== SUBSCRIPTION SPECIFIC FORMATTERS ====================

/**
 * Formatear suscripción completa para display
 */
export function formatSubscriptionForDisplay(subscription: Subscription): {
  name: string;
  status: string;
  statusVariant: BadgeVariant;
  planType: string;
  planTypeVariant: BadgeVariant;
  billingCycle: string;
  cost: string;
  renewalDate: string;
  renewalStatus: ReturnType<typeof getRenewalStatus>;
  isActive: boolean;
  isPaid: boolean;
} {
  return {
    name: subscription.service_name,
    status: formatStatus(subscription.status),
    statusVariant: getStatusVariant(subscription.status),
    planType: formatPlanType(subscription.plan_type),
    planTypeVariant: getPlanTypeVariant(subscription.plan_type),
    billingCycle: formatBillingCycle(subscription.billing_cycle),
    cost: formatCurrency(subscription.cost),
    renewalDate: formatRenewalDate(subscription.renewal_date),
    renewalStatus: getRenewalStatus(subscription.renewal_date),
    isActive: subscription.status === 'active',
    isPaid: subscription.plan_type === 'paid' && parseFloat(subscription.cost) > 0
  };
}

/**
 * Formatear resumen de costo mensual/anual
 */
export function formatCostSummary(subscription: Subscription): {
  amount: string;
  period: string;
  monthlyEquivalent?: string;
  annualEquivalent?: string;
} {
  const cost = parseFloat(subscription.cost);
  const { billing_cycle } = subscription;
  
  if (cost === 0 || billing_cycle === 'none') {
    return {
      amount: 'Gratis',
      period: ''
    };
  }
  
  const formatted = formatCurrency(cost);
  
  switch (billing_cycle) {
    case 'monthly':
      return {
        amount: formatted,
        period: 'al mes',
        annualEquivalent: formatCurrency(cost * 12) + ' al año'
      };
    case 'yearly':
      return {
        amount: formatted,
        period: 'al año',
        monthlyEquivalent: formatCurrency(cost / 12) + ' al mes'
      };
    case 'one_time':
      return {
        amount: formatted,
        period: 'pago único'
      };
    default:
      return {
        amount: formatted,
        period: ''
      };
  }
}

// ==================== STATISTICS FORMATTERS ====================

/**
 * Formatear estadísticas de suscripciones
 */
export function formatSubscriptionStats(stats: {
  total: number;
  active: number;
  pending: number;
  cancelled: number;
  expired: number;
  trialing: number;
  totalCost: number;
  averageCost: number;
  monthlyCost: number;
  yearlyCost: number;
}): {
  totalFormatted: string;
  activePercentage: string;
  totalCostFormatted: string;
  averageCostFormatted: string;
  monthlyCostFormatted: string;
  yearlyCostFormatted: string;
  statusBreakdown: Array<{ status: string; count: number; percentage: string; color: string }>;
} {
  const { total } = stats;
  
  const statusBreakdown = [
    { key: 'active', count: stats.active },
    { key: 'pending', count: stats.pending },
    { key: 'trialing', count: stats.trialing },
    { key: 'cancelled', count: stats.cancelled },
    { key: 'expired', count: stats.expired }
  ].map(item => ({
    status: formatStatus(item.key),
    count: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) + '%' : '0%',
    color: getStatusColor(item.key)
  }));
  
  return {
    totalFormatted: total.toLocaleString(),
    activePercentage: total > 0 ? ((stats.active / total) * 100).toFixed(1) + '%' : '0%',
    totalCostFormatted: formatCurrency(stats.totalCost),
    averageCostFormatted: formatCurrency(stats.averageCost),
    monthlyCostFormatted: formatCurrency(stats.monthlyCost),
    yearlyCostFormatted: formatCurrency(stats.yearlyCost),
    statusBreakdown
  };
}

// ==================== FORM OPTION PROVIDERS ====================

/**
 * Obtener opciones para formularios
 */
export function getFormOptions() {
  return {
    statuses: Object.entries(STATUS_TEXTS).map(([value, label]) => ({ value, label })),
    planTypes: Object.entries(PLAN_TYPE_TEXTS).map(([value, label]) => ({ value, label })),
    billingCycles: Object.entries(BILLING_CYCLE_TEXTS).map(([value, label]) => ({ value, label }))
  };
}

// ==================== SEARCH/FILTER HELPERS ====================

/**
 * Crear texto de búsqueda para una suscripción (para filtrado local)
 */
export function createSearchText(subscription: Subscription): string {
  return [
    subscription.service_name,
    formatStatus(subscription.status),
    formatPlanType(subscription.plan_type),
    formatBillingCycle(subscription.billing_cycle),
    formatCurrency(subscription.cost),
    subscription.id.toString()
  ].join(' ').toLowerCase();
}

/**
 * Formatear filtros activos para display
 */
export function formatActiveFilters(filters: Record<string, any>): Array<{ key: string; label: string; value: string }> {
  const formatted: Array<{ key: string; label: string; value: string }> = [];
  
  if (filters.status) {
    formatted.push({
      key: 'status',
      label: 'Estado',
      value: formatStatus(filters.status)
    });
  }
  
  if (filters.plan_type) {
    formatted.push({
      key: 'plan_type',
      label: 'Tipo de Plan',
      value: formatPlanType(filters.plan_type)
    });
  }
  
  if (filters.billing_cycle) {
    formatted.push({
      key: 'billing_cycle',
      label: 'Ciclo de Facturación',
      value: formatBillingCycle(filters.billing_cycle)
    });
  }
  
  if (filters.cost_min) {
    formatted.push({
      key: 'cost_min',
      label: 'Costo mínimo',
      value: formatCurrency(filters.cost_min)
    });
  }
  
  if (filters.cost_max) {
    formatted.push({
      key: 'cost_max',
      label: 'Costo máximo',
      value: formatCurrency(filters.cost_max)
    });
  }
  
  return formatted;
}