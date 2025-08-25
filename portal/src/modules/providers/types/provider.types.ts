// src/modules/providers/types/provider.types.ts

export interface Provider {
  id: number;
  name: string;
  website?: string;
  contact_info?: string;
  notes?: string;
  status?: 'active' | 'expired';
  
  // Metadata
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface CreateProviderData {
  name: string;
  website?: string;
  contact_info?: string;
  notes?: string;
  status?: 'active' | 'expired';
}

export interface UpdateProviderData extends Partial<CreateProviderData> {
  id: number;
}

export interface ProviderFilters {
  search?: string;
  status?: 'active' | 'expired' | 'all';
}

export interface ProvidersResponse {
  data: Provider[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}