// src/modules/domains/types/domain.types.ts

export interface Domain {
  id: number;
  domain_: string; // The actual domain name field from your schema
  client_id: number;
  provider_id: number;
  purchase_date?: string; // date string
  expiration_date?: string; // date string
  renewal_price: number;
  status: 'active' | 'expired' | 'pending_transfer';
  dns_provider?: string;
  notes?: string;
  
  // Metadata
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface CreateDomainData {
  domain_: string;
  client_id: number;
  provider_id: number;
  purchase_date?: string;
  expiration_date?: string;
  renewal_price: number;
  status: 'active' | 'expired' | 'pending_transfer';
  dns_provider?: string;
  notes?: string;
}

export interface UpdateDomainData extends Partial<CreateDomainData> {
  id: number;
}

export interface DomainFilters {
  search?: string;
  status?: 'active' | 'expired' | 'pending_transfer' | 'all';
  client_id?: number;
  provider_id?: number;
  expiring_soon?: boolean; // domains expiring in the next 30 days
}

export interface DomainsResponse {
  data: Domain[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

// For related data
export interface DomainWithRelations extends Domain {
  client?: {
    id: number;
    name: string;
    email: string;
    status: string;
  };
  provider?: {
    id: number;
    name: string;
    website?: string;
    status?: string;
  };
}