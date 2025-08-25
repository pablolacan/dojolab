// src/modules/services/types/service.types.ts

export interface Service {
  id: number;
  service_name: string;
  description?: string;
  category: 'hosting' | 'maintenance' | 'plugins' | 'licenses' | 'development';
  status?: 'active' | 'inactive' | 'discontinued';
  price: number;
  cost?: number;
  profit_margin?: number;
  billing_type?: 'direct_billing' | 'reseller';
  billing_cycle?: 'monthly' | 'yearly' | 'one_time';
  client_id?: number;
  start_date: string; // date string
  end_date: string; // date string
  next_billing_date?: string; // datetime string
  
  // Metadata
  user_created?: string;
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface CreateServiceData {
  service_name: string;
  description?: string;
  category: 'hosting' | 'maintenance' | 'plugins' | 'licenses' | 'development';
  status?: 'active' | 'inactive' | 'discontinued';
  price: number;
  cost?: number;
  profit_margin?: number;
  billing_type?: 'direct_billing' | 'reseller';
  billing_cycle?: 'monthly' | 'yearly' | 'one_time';
  client_id?: number;
  start_date: string;
  end_date: string;
  next_billing_date?: string;
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  id: number;
}

export interface ServiceFilters {
  search?: string;
  category?: 'hosting' | 'maintenance' | 'plugins' | 'licenses' | 'development' | 'all';
  status?: 'active' | 'inactive' | 'discontinued' | 'all';
  billing_type?: 'direct_billing' | 'reseller' | 'all';
  billing_cycle?: 'monthly' | 'yearly' | 'one_time' | 'all';
  client_id?: number;
}

export interface ServicesResponse {
  data: Service[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}

// For related data
export interface ServiceWithClient extends Service {
  client?: {
    id: number;
    name: string;
    email: string;
    status: string;
  };
}