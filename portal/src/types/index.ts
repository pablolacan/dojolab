// src/types/index.ts

// Base Directus interfaces
export interface DirectusResponse<T> {
  data: T;
}

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  filesize: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Maintenance Mode
export interface MaintenanceModeData {
  id: number;
  status: string;
  user_updated: string | null;
  title: string;
  message: string;
  estimated_time: string;
  contact_email: string;
  is_active: boolean;
  show_contact_email: boolean;
}

// API Error types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  expires: number;
  refresh_token: string;
}

export interface DirectusUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  role: {
    id: string;
    name: string;
    admin_access?: boolean;
    description?: string;
    icon?: string;
    parent?: string | null;
    children?: any[];
    policies?: string[];
    users?: string[];
  } | string;
  status: string;
  last_access: string;
  last_page: string | null;
}

export interface AuthState {
  user: DirectusUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Subscriptions
export interface Subscription {
  id: number;
  status: 'active' | 'pending' | 'cancelled' | 'expired' | 'trialing';
  date_created: string;
  user_updated: string | null;
  date_updated: string | null;
  service_name: string;
  plan_type: 'free' | 'paid';
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'none';
  renewal_date: string;
  cost: string;
}

export interface DirectusListResponse<T> {
  data: T[];
  meta?: {
    total_count: number;
    filter_count: number;
  };
}

// Configuration
export interface AppConfig {
  directusUrl: string;
  appName: string;
  appVersion: string;
  isDevelopment: boolean;
  maintenanceAllowedIPs: string[];
}

export * from './domain';