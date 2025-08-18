// src/utils/formatters/invoice-formatter.ts

import type { Invoice, InvoiceWithRelations, InvoiceStatus, InvoiceStats } from '../../types/invoice';
import type { BadgeVariant } from './subscription-formatter';

// ==================== TEXT MAPPINGS ====================

const STATUS_TEXTS: Record<string, string> = {
  'draft': 'Borrador',
  'sent': 'Enviada',
  'paid': 'Pagada',
  'overdue': 'Atrasada'
};

// ==================== VARIANT MAPPINGS ====================

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  'draft': 'neutral',
  'sent': 'info',
  'paid': 'success',
  'overdue': 'error'
};

const STATUS_COLORS: Record<string, string> = {
  'draft': '#6B7280',
  'sent': '#3B82F6',
  'paid': '#22c55e',
  'overdue': '#ef4444'
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  'draft': 'Factura en preparación',
  'sent': 'Factura enviada al cliente',
  'paid': 'Factura pagada completamente',
  'overdue': 'Factura vencida sin pagar'
};

const STATUS_ICONS: Record<string, string> = {
  'draft': '📝',
  'sent': '📤',
  'paid': '✅',
  'overdue': '⚠️'
};

// ==================== BASIC FORMATTERS ====================

/**
 * Formatear estado a texto legible
 */
export function formatInvoiceStatus(status: string): string {
  return STATUS_TEXTS[status] || status;
}

/**
 * Obtener variante de badge para estado
 */
export function getInvoiceStatusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] || 'neutral';
}

/**
 * Obtener color para estado
 */
export function getInvoiceStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6B7280';
}

/**
 * Obtener información completa del estado
 */
export function getInvoiceStatusInfo(status: string): InvoiceStatus {
  return {
    value: status as 'draft' | 'sent' | 'paid' | 'overdue',
    label: formatInvoiceStatus(status),
    color: getInvoiceStatusColor(status),
    description: STATUS_DESCRIPTIONS[status] || '',
    icon: STATUS_ICONS[status] || '📄'
  };
}

// ==================== CURRENCY FORMATTERS ====================

/**
 * Formatear cantidad como moneda guatemalteca
 */
export function formatInvoiceAmount(amount: string | number, options: {
  currency?: string;
  locale?: string;
  showZero?: boolean;
} = {}): string {
  const {
    currency = 'GTQ',
    locale = 'es-GT',
    showZero = true
  } = options;

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return 'Q0.00';
  
  if (num === 0 && !showZero) return '-';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (error) {
    return `Q${num.toFixed(2)}`;
  }
}

/**
 * Formatear cantidad compacta (K, M para miles y millones)
 */
export function formatInvoiceAmountCompact(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return 'Q0';
  if (num === 0) return 'Q0';
  
  if (num >= 1000000) {
    return `Q${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `Q${(num / 1000).toFixed(1)}K`;
  } else {
    return `Q${num.toFixed(0)}`;
  }
}

// ==================== DATE FORMATTERS ====================

/**
 * Formatear fecha de factura
 */
export function formatInvoiceDate(dateString: string, options: {
  locale?: string;
  style?: 'short' | 'medium' | 'long';
} = {}): string {
  const {
    locale = 'es-GT',
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
 * Calcular días desde/hasta una fecha
 */
export function calculateDaysFromInvoiceDate(dateString: string): {
  daysAgo: number;
  isOverdue: boolean;
  status: 'recent' | 'normal' | 'warning' | 'overdue';
  message: string;
} {
  try {
    const invoiceDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    invoiceDate.setHours(0, 0, 0, 0);
    
    const diffInMs = today.getTime() - invoiceDate.getTime();
    const daysAgo = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    let status: 'recent' | 'normal' | 'warning' | 'overdue';
    let message: string;
    let isOverdue = false;
    
    if (daysAgo < 0) {
      status = 'recent';
      message = `En ${Math.abs(daysAgo)} días`;
    } else if (daysAgo === 0) {
      status = 'recent';
      message = 'Hoy';
    } else if (daysAgo <= 7) {
      status = 'recent';
      message = `Hace ${daysAgo} días`;
    } else if (daysAgo <= 30) {
      status = 'normal';
      message = `Hace ${daysAgo} días`;
    } else if (daysAgo <= 60) {
      status = 'warning';
      message = `Hace ${daysAgo} días`;
      isOverdue = true;
    } else {
      status = 'overdue';
      message = `Hace ${daysAgo} días`;
      isOverdue = true;
    }
    
    return { daysAgo, isOverdue, status, message };
  } catch (error) {
    return { 
      daysAgo: 0, 
      isOverdue: false, 
      status: 'normal', 
      message: 'Fecha inválida' 
    };
  }
}

// ==================== INVOICE NUMBER FORMATTERS ====================

/**
 * Formatear número de factura para display
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
  if (!invoiceNumber) return 'Sin número';
  
  // Si sigue el patrón INV-YYYY-MM-NNN, formatearlo mejor
  const pattern = /^([A-Z]+)-(\d{4})-(\d{2})-(\d{3})$/;
  const match = invoiceNumber.match(pattern);
  
  if (match) {
    const [, prefix, year, month, number] = match;
    return `${prefix}-${year}-${month}-${number}`;
  }
  
  return invoiceNumber;
}

/**
 * Extraer información del número de factura
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  year?: number;
  month?: number;
  sequence?: number;
  isValid: boolean;
} {
  const pattern = /^([A-Z]+)-(\d{4})-(\d{2})-(\d{3})$/;
  const match = invoiceNumber.match(pattern);
  
  if (match) {
    const [, prefix, year, month, sequence] = match;
    return {
      prefix,
      year: parseInt(year),
      month: parseInt(month),
      sequence: parseInt(sequence),
      isValid: true
    };
  }
  
  return {
    prefix: invoiceNumber,
    isValid: false
  };
}

// ==================== FILE FORMATTERS ====================

/**
 * Formatear información del archivo PDF
 */
export function formatInvoiceFile(invoice: Invoice | InvoiceWithRelations): {
  hasFile: boolean;
  fileName?: string;
  fileSize?: string;
  downloadUrl?: string;
} {
  if (!invoice.invoice_file) {
    return { hasFile: false };
  }
  
  // Si tenemos datos del archivo completo
  if ('file' in invoice && invoice.file) {
    return {
      hasFile: true,
      fileName: invoice.file.filename_download || 'factura.pdf',
      fileSize: formatFileSize(parseInt(invoice.file.filesize)),
      downloadUrl: `/assets/${invoice.file.id}`
    };
  }
  
  // Solo tenemos el ID del archivo
  return {
    hasFile: true,
    fileName: `factura-${invoice.invoice_number}.pdf`,
    downloadUrl: `/assets/${invoice.invoice_file}`
  };
}

/**
 * Formatear tamaño de archivo
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ==================== INVOICE SPECIFIC FORMATTERS ====================

/**
 * Formatear factura completa para display
 */
export function formatInvoiceForDisplay(invoice: Invoice): {
  number: string;
  formattedNumber: string;
  amount: string;
  compactAmount: string;
  date: string;
  relativeDate: string;
  status: string;
  statusVariant: BadgeVariant;
  statusColor: string;
  statusIcon: string;
  file: ReturnType<typeof formatInvoiceFile>;
  clientName: string;
  daysInfo: ReturnType<typeof calculateDaysFromInvoiceDate>;
  isPaid: boolean;
  isOverdue: boolean;
} {
  const daysInfo = calculateDaysFromInvoiceDate(invoice.invoice_date);
  
  return {
    number: invoice.invoice_number,
    formattedNumber: formatInvoiceNumber(invoice.invoice_number),
    amount: formatInvoiceAmount(invoice.amount),
    compactAmount: formatInvoiceAmountCompact(invoice.amount),
    date: formatInvoiceDate(invoice.invoice_date),
    relativeDate: daysInfo.message,
    status: formatInvoiceStatus(invoice.status),
    statusVariant: getInvoiceStatusVariant(invoice.status),
    statusColor: getInvoiceStatusColor(invoice.status),
    statusIcon: STATUS_ICONS[invoice.status] || '📄',
    file: formatInvoiceFile(invoice),
    clientName: typeof invoice.client_id === 'object' ? invoice.client_id.name : 'Cliente desconocido',
    daysInfo,
    isPaid: invoice.status === 'paid',
    isOverdue: invoice.status === 'overdue' || (invoice.status === 'sent' && daysInfo.isOverdue)
  };
}

/**
 * Formatear factura con relaciones para vista detallada
 */
export function formatInvoiceWithRelations(invoice: InvoiceWithRelations): {
  invoice: ReturnType<typeof formatInvoiceForDisplay>;
  client: {
    name: string;
    email: string;
  } | null;
  file: ReturnType<typeof formatInvoiceFile>;
} {
  const formattedInvoice = formatInvoiceForDisplay(invoice);
  
  return {
    invoice: formattedInvoice,
    client: invoice.client ? {
      name: invoice.client.name,
      email: invoice.client.email
    } : null,
    file: formatInvoiceFile(invoice)
  };
}

// ==================== STATISTICS FORMATTERS ====================

/**
 * Formatear estadísticas de facturas
 */
export function formatInvoiceStats(stats: InvoiceStats): {
  totalFormatted: string;
  totalAmountFormatted: string;
  paidAmountFormatted: string;
  pendingAmountFormatted: string;
  overdueAmountFormatted: string;
  averageAmountFormatted: string;
  paymentRateFormatted: string;
  averagePaymentDaysFormatted: string;
  statusBreakdown: Array<{ 
    status: string; 
    count: number; 
    percentage: string; 
    amount: string;
    color: string; 
    icon: string;
  }>;
} {
  const { total } = stats;
  
  const statusBreakdown = [
    { key: 'paid', count: stats.paid, amount: stats.paidAmount },
    { key: 'sent', count: stats.sent, amount: stats.pendingAmount },
    { key: 'overdue', count: stats.overdue, amount: stats.overdueAmount },
    { key: 'draft', count: stats.draft, amount: 0 }
  ].map(item => ({
    status: formatInvoiceStatus(item.key),
    count: item.count,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) + '%' : '0%',
    amount: formatInvoiceAmount(item.amount),
    color: getInvoiceStatusColor(item.key),
    icon: STATUS_ICONS[item.key] || '📄'
  }));
  
  const paymentRate = total > 0 ? (stats.paid / total) * 100 : 0;
  
  return {
    totalFormatted: total.toLocaleString(),
    totalAmountFormatted: formatInvoiceAmount(stats.totalAmount),
    paidAmountFormatted: formatInvoiceAmount(stats.paidAmount),
    pendingAmountFormatted: formatInvoiceAmount(stats.pendingAmount),
    overdueAmountFormatted: formatInvoiceAmount(stats.overdueAmount),
    averageAmountFormatted: formatInvoiceAmount(stats.averageAmount),
    paymentRateFormatted: `${paymentRate.toFixed(1)}%`,
    averagePaymentDaysFormatted: `${Math.round(stats.averagePaymentTime)} días`,
    statusBreakdown
  };
}

// ==================== FORM OPTIONS ====================

/**
 * Obtener opciones para formularios
 */
export function getInvoiceFormOptions() {
  return {
    statuses: Object.entries(STATUS_TEXTS).map(([value, label]) => ({ 
      value, 
      label,
      color: STATUS_COLORS[value],
      description: STATUS_DESCRIPTIONS[value],
      icon: STATUS_ICONS[value]
    }))
  };
}

// ==================== SEARCH HELPERS ====================

/**
 * Crear texto de búsqueda para una factura
 */
export function createInvoiceSearchText(invoice: Invoice): string {
  const clientName = typeof invoice.client_id === 'object' ? invoice.client_id.name : '';
  
  return [
    invoice.invoice_number,
    formatInvoiceStatus(invoice.status),
    formatInvoiceAmount(invoice.amount),
    clientName,
    invoice.notes || '',
    invoice.id.toString()
  ].join(' ').toLowerCase();
}

/**
 * Formatear filtros activos para display
 */
export function formatActiveInvoiceFilters(filters: Record<string, any>): Array<{ key: string; label: string; value: string }> {
  const formatted: Array<{ key: string; label: string; value: string }> = [];
  
  if (filters.status) {
    formatted.push({
      key: 'status',
      label: 'Estado',
      value: formatInvoiceStatus(filters.status)
    });
  }
  
  if (filters.client_id) {
    formatted.push({
      key: 'client_id',
      label: 'Cliente',
      value: `Cliente ID: ${filters.client_id}`
    });
  }
  
  if (filters.amount_min) {
    formatted.push({
      key: 'amount_min',
      label: 'Monto mínimo',
      value: formatInvoiceAmount(filters.amount_min)
    });
  }
  
  if (filters.amount_max) {
    formatted.push({
      key: 'amount_max',
      label: 'Monto máximo',
      value: formatInvoiceAmount(filters.amount_max)
    });
  }
  
  if (filters.date_from) {
    formatted.push({
      key: 'date_from',
      label: 'Desde',
      value: formatInvoiceDate(filters.date_from)
    });
  }
  
  if (filters.date_to) {
    formatted.push({
      key: 'date_to',
      label: 'Hasta',
      value: formatInvoiceDate(filters.date_to)
    });
  }
  
  return formatted;
}

// ==================== FINANCIAL ANALYSIS ====================

/**
 * Calcular métricas de flujo de caja
 */
export function calculateCashFlowMetrics(invoices: Invoice[]): {
  currentMonth: number;
  nextMonth: number;
  followingMonth: number;
  totalProjected: number;
} {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const followingMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const afterFollowing = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  
  let currentMonthAmount = 0;
  let nextMonthAmount = 0;
  let followingMonthAmount = 0;
  
  invoices.forEach(invoice => {
    if (invoice.status === 'sent' || invoice.status === 'overdue') {
      const amount = parseFloat(invoice.amount);
      const invoiceDate = new Date(invoice.invoice_date);
      
      if (invoiceDate >= currentMonth && invoiceDate < nextMonth) {
        currentMonthAmount += amount;
      } else if (invoiceDate >= nextMonth && invoiceDate < followingMonth) {
        nextMonthAmount += amount;
      } else if (invoiceDate >= followingMonth && invoiceDate < afterFollowing) {
        followingMonthAmount += amount;
      }
    }
  });
  
  return {
    currentMonth: currentMonthAmount,
    nextMonth: nextMonthAmount,
    followingMonth: followingMonthAmount,
    totalProjected: currentMonthAmount + nextMonthAmount + followingMonthAmount
  };
}