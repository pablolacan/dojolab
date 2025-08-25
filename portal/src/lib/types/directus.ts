// Tipos básicos de Directus

export interface DirectusUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  role?: DirectusRole | string;
  status: 'active' | 'inactive' | 'invited' | 'draft' | 'suspended';
  last_access?: string;
  last_page?: string;
  provider?: string;
  external_identifier?: string;
  timezone?: string;
  locale?: string;
  theme?: 'light' | 'dark' | 'auto';
  date_created?: string;
  date_updated?: string;
}

export interface DirectusRole {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  ip_access?: string[];
  enforce_tfa: boolean;
  admin_access: boolean;
  app_access: boolean;
}

// Schema básico para el cliente Directus
export interface DirectusSchema {
  directus_users: DirectusUser[];
  directus_roles: DirectusRole[];
}

// Tipos de respuesta de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Tipos de autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  expires: number;
  user?: DirectusUser;
}