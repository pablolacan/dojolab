// src/modules/invoices/types/invoice.types.ts

export interface Invoice {
  id: number;
  client_id: number;
  projects_id?: number; // Optional since projects module isn't implemented yet
  invoice_number: string;
  invoice_date: string; // datetime string
  amount: number;
  invoice_file: string; // UUID reference to directus_files
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  
  // Metadata
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface CreateInvoiceData {
  client_id: number;
  projects_id?: number;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  invoice_file: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  id: number;
}

export interface InvoiceFilters {
  search?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'all';
  client_id?: number;
  projects_id?: number;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface InvoicesResponse {
  data: Invoice[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

// For related data
export interface InvoiceWithRelations extends Invoice {
  client?: {
    id: number;
    name: string;
    email: string;
    status: string;
  };
  project?: {
    id: number;
    project_name: string;
    status: string;
  };
}

// For summary/stats
export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  draft_count: number;
  sent_count: number;
  paid_count: number;
  overdue_count: number;
  draft_amount: number;
  sent_amount: number;
  paid_amount: number;
  overdue_amount: number;
}