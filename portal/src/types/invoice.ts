// src/types/invoice.ts

export interface Invoice {
  id: number;
  client_id: number | import('./client').Client;
  invoice_number: string;
  invoice_date: string;
  amount: string; // Decimal as string from Directus
  invoice_file?: string; // UUID reference to directus_files
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  
  // Timestamps automáticos de Directus
  date_created: string;
  date_updated?: string;
  user_created?: string;
  user_updated?: string;
}

export interface CreateInvoiceData {
  client_id: number;
  invoice_number: string;
  invoice_date: string;
  amount: string;
  invoice_file?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  id?: never; // Prevenir actualizar el ID
}

export interface InvoiceFilters {
  status?: string;
  client_id?: number;
  amount_min?: number;
  amount_max?: number;
  date_from?: string;
  date_to?: string;
  has_file?: boolean;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageAmount: number;
  averagePaymentTime: number; // días promedio para pago
}

// Tipos extendidos para mostrar relaciones
export interface InvoiceWithRelations extends Invoice {
  client?: import('./client').Client;
  file?: import('../types').DirectusFile;
}

// Para búsquedas y autocompletado
export interface InvoiceOption {
  id: number;
  invoice_number: string;
  amount: string;
  status: string;
  client_name?: string;
}

// Estados de factura con metadatos
export interface InvoiceStatus {
  value: 'draft' | 'sent' | 'paid' | 'overdue';
  label: string;
  color: string;
  description: string;
  icon: string;
}

// Para análisis financiero
export interface InvoiceFinancialSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentRate: number; // Porcentaje de facturas pagadas
  averageDaysToPayment: number;
  monthlyRecurring: number;
  projectedRevenue: number;
}

// Para reportes por período
export interface InvoicePeriodReport {
  period: string; // '2025-01', '2025-Q1', etc.
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
  topClients: Array<{
    client_id: number;
    client_name: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
}

// Para flujo de caja
export interface CashFlowProjection {
  date: string;
  expectedIncome: number;
  overdueAmount: number;
  projectedIncome: number;
  invoicesDue: Invoice[];
}

// Para tracking de pagos
export interface PaymentTracking {
  invoice_id: number;
  expected_payment_date: string;
  actual_payment_date?: string;
  days_overdue: number;
  payment_method?: string;
  payment_reference?: string;
}

// Removed default export because 'Invoice' is a type, not a value.