// src/services/api/endpoints.ts

/**
 * Definición centralizada de todos los endpoints de la API
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/users/me'
  },

  // Users
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
    ME_WITH_ROLE: '/users/me?fields=*,role.*'
  },

  // Files & Assets
  FILES: {
    BASE: '/files',
    BY_ID: (id: string) => `/files/${id}`,
    UPLOAD: '/files'
  },

  ASSETS: {
    BY_ID: (id: string) => `/assets/${id}`,
    WITH_TRANSFORM: (id: string, params?: Record<string, string | number>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          searchParams.append(key, value.toString());
        });
      }
      const queryString = searchParams.toString();
      return `/assets/${id}${queryString ? `?${queryString}` : ''}`;
    }
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    BASE: '/items/subscriptions',
    BY_ID: (id: number) => `/items/subscriptions/${id}`,
    BULK_DELETE: '/items/subscriptions',
    BULK_UPDATE: '/items/subscriptions'
  },

  // Maintenance Mode
  MAINTENANCE: {
    BASE: '/items/maintenance_mode'
  },

  // System
  SYSTEM: {
    PING: '/server/ping',
    INFO: '/server/info',
    HEALTH: '/server/health'
  },

  // Collections (generic)
  COLLECTIONS: {
    ITEMS: (collection: string) => `/items/${collection}`,
    ITEM_BY_ID: (collection: string, id: string | number) => `/items/${collection}/${id}`
  }
} as const;

/**
 * Tipos para los endpoints (para type safety)
 */
export type EndpointKeys = keyof typeof API_ENDPOINTS;
export type AuthEndpoints = typeof API_ENDPOINTS.AUTH;
export type UserEndpoints = typeof API_ENDPOINTS.USERS;
export type FileEndpoints = typeof API_ENDPOINTS.FILES;
export type AssetEndpoints = typeof API_ENDPOINTS.ASSETS;
export type SubscriptionEndpoints = typeof API_ENDPOINTS.SUBSCRIPTIONS;
export type MaintenanceEndpoints = typeof API_ENDPOINTS.MAINTENANCE;
export type SystemEndpoints = typeof API_ENDPOINTS.SYSTEM;

/**
 * Helper para construir URLs con query parameters
 */
export const buildUrlWithParams = (
  baseUrl: string, 
  params: Record<string, string | number | boolean | undefined>
): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Helper para construir filtros de Directus
 */
export const buildDirectusFilters = (filters: Record<string, any>): Record<string, string> => {
  const directusFilters: Record<string, string> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Manejo especial para diferentes tipos de filtros
      if (key.endsWith('_min')) {
        const field = key.replace('_min', '');
        directusFilters[`filter[${field}][_gte]`] = value.toString();
      } else if (key.endsWith('_max')) {
        const field = key.replace('_max', '');
        directusFilters[`filter[${field}][_lte]`] = value.toString();
      } else if (key.endsWith('_from')) {
        const field = key.replace('_from', '');
        directusFilters[`filter[${field}][_gte]`] = value.toString();
      } else if (key.endsWith('_to')) {
        const field = key.replace('_to', '');
        directusFilters[`filter[${field}][_lte]`] = value.toString();
      } else {
        // Filtro exacto por defecto
        directusFilters[`filter[${key}][_eq]`] = value.toString();
      }
    }
  });
  
  return directusFilters;
};

/**
 * Helper para construir parámetros de paginación de Directus
 */
export const buildDirectusPagination = (params: {
  limit?: number;
  offset?: number;
  page?: number;
}): Record<string, string> => {
  const paginationParams: Record<string, string> = {};
  
  if (params.limit) {
    paginationParams.limit = params.limit.toString();
  }
  
  if (params.offset) {
    paginationParams.offset = params.offset.toString();
  } else if (params.page && params.limit) {
    // Calcular offset basado en página
    paginationParams.offset = ((params.page - 1) * params.limit).toString();
  }
  
  return paginationParams;
};

/**
 * Helper para construir parámetros de ordenamiento de Directus
 */
export const buildDirectusSort = (sort: string[]): Record<string, string> => {
  if (!sort || sort.length === 0) return {};
  
  return {
    sort: sort.join(',')
  };
};

/**
 * Helper para construir query completa de Directus
 */
export const buildDirectusQuery = (params: {
  filters?: Record<string, any>;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string[];
  fields?: string[];
}): Record<string, string> => {
  const query: Record<string, string> = {};
  
  // Filtros
  if (params.filters) {
    Object.assign(query, buildDirectusFilters(params.filters));
  }
  
  // Búsqueda
  if (params.search) {
    query.search = params.search;
  }
  
  // Paginación
  Object.assign(query, buildDirectusPagination({
    limit: params.limit,
    offset: params.offset,
    page: params.page
  }));
  
  // Ordenamiento
  if (params.sort) {
    Object.assign(query, buildDirectusSort(params.sort));
  }
  
  // Campos específicos
  if (params.fields && params.fields.length > 0) {
    query.fields = params.fields.join(',');
  }
  
  return query;
};