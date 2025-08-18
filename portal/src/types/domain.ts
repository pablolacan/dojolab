// src/types/domain.ts

export interface Domain {
  id: number;
  domain_: string; // Note: Directus usa "domain_" por conflicto con palabra reservada
  client_id: number | Client;
  provider_id: number | Provider;
  purchase_date?: string;
  expiration_date: string;
  renewal_price: string;
  status: 'active' | 'expired' | 'pending_transfer';
  dns_provider?: string;
  notes?: string;
  date_created: string;
  date_updated?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'prospect';
}

export interface Provider {
  id: number;
  name: string;
  website?: string;
  status: 'active' | 'expired';
}

export interface CreateDomainData {
  domain_: string;
  client_id: number;
  provider_id: number;
  purchase_date?: string;
  expiration_date: string;
  renewal_price: string;
  status?: 'active' | 'expired' | 'pending_transfer';
  dns_provider?: string;
  notes?: string;
}

export interface UpdateDomainData extends Partial<CreateDomainData> {
  id?: never;
}

export interface DomainFilters {
  status?: string;
  client_id?: number;
  provider_id?: number;
  expiring_soon?: boolean; // Para filtrar próximos a vencer
}

export interface DomainStats {
  total: number;
  active: number;
  expired: number;
  pending_transfer: number;
  totalCost: number;
  averageCost: number;
  expiringIn30Days: number;
  expiringIn7Days: number;
}