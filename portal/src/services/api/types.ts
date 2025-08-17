// src/services/api/types.ts

/**
 * Tipos específicos para servicios de API
 * Extienden y especializan los tipos base de types/index.ts
 */

import type { 
  DirectusUser, 
  AuthTokens,
  MaintenanceModeData,
  DirectusListResponse
} from '../../types';

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Tipos de respuesta comunes
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends DirectusListResponse<T> {
  meta: {
    total_count: number;
    filter_count: number;
    current_page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

/**
 * Opciones de request genéricas
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface QueryOptions extends RequestOptions {
  filters?: Record<string, any>;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string[];
  fields?: string[];
}

// ==================== AUTH SERVICE TYPES ====================

export interface AuthServiceResponse {
  user: DirectusUser;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token?: string;
}

// ==================== USER SERVICE TYPES ====================

export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  [key: string]: any;
}

export interface UserQueryOptions extends QueryOptions {
  includeRole?: boolean;
  includePolicies?: boolean;
}

// ==================== FILE SERVICE TYPES ====================

export interface FileUploadOptions {
  title?: string;
  description?: string;
  folder?: string;
  storage?: string;
}

export interface FileTransformOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpg' | 'png' | 'webp' | 'avif';
  [key: string]: string | number | undefined;
}

export interface AssetUrlOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpg' | 'png' | 'webp' | 'avif';
  download?: string | boolean; // string para filename, boolean para enable/disable
  filename?: string;
  [key: string]: string | number | boolean | undefined;
}

// ==================== SUBSCRIPTION SERVICE TYPES ====================

export interface SubscriptionFilters {
  status?: string;
  plan_type?: string;
  billing_cycle?: string;
  service_name?: string;
  cost_min?: number;
  cost_max?: number;
  date_from?: string;
  date_to?: string;
}

export interface SubscriptionQueryOptions extends QueryOptions {
  filters?: SubscriptionFilters;
}

export interface CreateSubscriptionData {
  service_name: string;
  plan_type: 'free' | 'paid';
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'none';
  cost: string;
  renewal_date: string;
  status?: 'active' | 'pending' | 'cancelled' | 'expired' | 'trialing';
}

export interface UpdateSubscriptionData extends Partial<CreateSubscriptionData> {
  id?: never; // Prevenir actualizar el ID
}

export interface SubscriptionStats {
  total: number;
  active: number;
  pending: number;
  cancelled: number;
  expired: number;
  trialing: number;
  totalCost: number;
  averageCost: number;
  monthlyCost: number;
  yearlyCost: number;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: number;
    error: string;
  }>;
}

// ==================== MAINTENANCE SERVICE TYPES ====================

export interface MaintenanceStatus {
  isActive: boolean;
  data: MaintenanceModeData | null;
  isAllowedIP: boolean;
  shouldShowMaintenance: boolean;
  userIP?: string;
}

export interface MaintenanceUpdateData {
  title?: string;
  message?: string;
  estimated_time?: string;
  contact_email?: string;
  is_active?: boolean;
  show_contact_email?: boolean;
}

// ==================== HEALTH SERVICE TYPES ====================

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime?: number;
  version?: string;
  database?: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
}

export interface SystemInfoResponse {
  version: string;
  node_version: string;
  uptime: number;
  memory_usage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

// ==================== ERROR TYPES ====================

export interface ServiceError extends Error {
  code?: string;
  status?: number;
  details?: any;
  timestamp?: string;
}

export interface ValidationError extends ServiceError {
  field?: string;
  value?: any;
  rule?: string;
}

export interface NetworkError extends ServiceError {
  timeout?: boolean;
  offline?: boolean;
}

// ==================== UTILITY TYPES ====================

/**
 * Tipo para operaciones CRUD genéricas
 */
export interface CrudOperations<T, CreateData, UpdateData> {
  getAll: (options?: QueryOptions) => Promise<PaginatedResponse<T>>;
  getById: (id: string | number) => Promise<T>;
  create: (data: CreateData) => Promise<T>;
  update: (id: string | number, data: UpdateData) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
}

/**
 * Tipo para servicios con cache
 */
export interface CacheableService {
  clearCache: () => void;
  refreshCache: () => Promise<void>;
  getCacheInfo: () => {
    size: number;
    lastUpdate: Date | null;
    hitRate: number;
  };
}

/**
 * Tipo para servicios con retry
 */
export interface RetryableService {
  retry: <T>(
    operation: () => Promise<T>, 
    options?: { maxRetries?: number; delay?: number }
  ) => Promise<T>;
}

// ==================== CONFIGURATION TYPES ====================

export interface ServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cache: boolean;
  debug: boolean;
}

export interface AuthServiceConfig extends ServiceConfig {
  tokenRefreshBuffer: number; // minutos antes de expiración para refresh
  maxRefreshRetries: number;
}

export interface FileServiceConfig extends ServiceConfig {
  maxFileSize: number;
  allowedTypes: string[];
  defaultTransforms: FileTransformOptions;
}

// ==================== EVENT TYPES ====================

export interface ServiceEvent<T = any> {
  type: string;
  timestamp: Date;
  data?: T;
  source: string;
}

export interface AuthEvent extends ServiceEvent {
  type: 'login' | 'logout' | 'refresh' | 'error';
  data?: {
    userId?: string;
    email?: string;
    error?: string;
  };
}

export interface DataEvent<T> extends ServiceEvent<T> {
  type: 'created' | 'updated' | 'deleted' | 'fetched';
  data: T;
  collection?: string;
}