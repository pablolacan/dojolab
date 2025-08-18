// src/types/client.ts

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  websites?: ClientWebsite[];
  
  // Timestamps automáticos de Directus
  date_created: string;
  date_updated?: string;
  user_created?: string;
  user_updated?: string;
}

export interface ClientWebsite {
  url: string;
  description?: string;
  is_primary?: boolean;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'prospect';
  notes?: string;
  websites?: ClientWebsite[];
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id?: never; // Prevenir actualizar el ID
}

export interface ClientFilters {
  status?: string;
  name?: string;
  email?: string;
  has_domains?: boolean; // Para filtrar clientes con/sin dominios
  created_from?: string;
  created_to?: string;
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  prospect: number;
  totalDomains: number;
  totalInvoices: number;
  totalRevenue: number;
  averageDomainsPerClient: number;
}

// Tipos extendidos para mostrar relaciones
export interface ClientWithRelations extends Client {
  domains?: import('./domain').Domain[];
  invoices?: import('./invoice').Invoice[];
  domainCount?: number;
  invoiceCount?: number;
  totalRevenue?: number;
  lastActivity?: string;
}

// Para búsquedas y autocompletado
export interface ClientOption {
  id: number;
  name: string;
  email: string;
  status: string;
}

// Estados de cliente con metadatos
export interface ClientStatus {
  value: 'active' | 'inactive' | 'prospect';
  label: string;
  color: string;
  description: string;
}