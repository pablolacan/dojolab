// src/modules/clients/types/client.types.ts

export interface Website {
  url: string;
  description?: string;
  is_primary?: boolean;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  websites?: Website[];
  logo?: string; // UUID reference to directus_files
  client_files?: string[]; // Array of file UUIDs
  
  // Metadata
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'prospect';
  notes?: string;
  websites?: Website[];
  logo?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: number;
}

export interface ClientFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'prospect' | 'all';
}

export interface ClientsResponse {
  data: Client[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

// For related data
export interface ClientWithRelations extends Client {
  services?: any[]; // Will define when we do services module
  domains?: any[];  // Will define when we do domains module
  invoices?: any[]; // Will define when we do invoices module
  projects?: any[]; // Will define when we do projects module
}